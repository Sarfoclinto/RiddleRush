/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery } from "convex/react";
import type { Id } from "myconvex/_generated/dataModel";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";

type Peer = {
  userId: string;
  pc: RTCPeerConnection;
  remoteStream?: MediaStream;
};

const SIGNAL_TTL_MS = 60 * 1000; // client-side safety TTL

export function useAudioChat(roomId: Id<"rooms">, userId: Id<"users">) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false); // user clicked Join Voice

  const peersRef = useRef<Map<string, Peer>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(
    new Map()
  );
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // server mutations/queries
  const sendSignal = useMutation(api.signal.sendSignal);
  const deleteSignal = useMutation(api.signal.deleteSignal);
  const cleanupOldSignals = useMutation(api.signal.cleanupOldSignals);
  const listPresence = useQuery(api.signal.listPresenceInRoom, { id: roomId });
  // subscribe to incoming signals (server query)
  const incomingSignals = useQuery(api.signal.listForUser, {
    roomId,
    toUserId: userId,
    since: Date.now() - SIGNAL_TTL_MS,
  });

  // ---------- audio analysis for speaking detection ----------
  const initAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      const ctx = audioContextRef.current;
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 256;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyserRef.current);

      const bufferLen = analyserRef.current.frequencyBinCount;
      const data = new Uint8Array(bufferLen);

      const check = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / bufferLen;
        const speaking = avg > 20;
        setIsSpeaking(speaking);
        // you could call a presence mutation here to update server-side speaking flag
        rafRef.current = requestAnimationFrame(check);
      };
      check();
    } catch (err) {
      console.warn("Audio analysis init failed", err);
    }
  }, []);

  // ---------- getUserMedia (but don't autoplay) ----------
  const initLocalStream = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      // start muted by default
      s.getAudioTracks().forEach((t) => (t.enabled = false));
      setLocalStream(s);
      initAudioAnalysis(s);
    } catch (err) {
      setError("Failed to access microphone. Check permissions.");
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  }, [initAudioAnalysis]);

  // ---------- Peer connection factory ----------
  const createPeerConnection = useCallback(
    (otherUserId: Id<"users">) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          // Add TURN server here for production: { urls: "turn:turn.example:3478", username, credential }
        ],
      });

      // add local tracks if available
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, localStream);
          } catch (e) {
            console.error(e);
            /* ignore */
          }
        });
      }

      pc.ontrack = (ev) => {
        const [remoteStream] = ev.streams;
        let audioEl = remoteAudioElementsRef.current.get(otherUserId);
        if (!audioEl) {
          audioEl = new Audio();
          audioEl.autoplay = true;
          audioEl.volume = speakerEnabled ? 1 : 0;
          remoteAudioElementsRef.current.set(otherUserId, audioEl);
        }
        audioEl.srcObject = remoteStream;
      };

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          // send candidate to the peer
          sendSignal({
            roomId,
            fromUserId: userId,
            toUserId: otherUserId,
            type: "ice",
            payload: ev.candidate.toJSON(),
          }).catch(console.error);
        }
      };

      pc.onnegotiationneeded = async () => {
        // create and send an offer
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sendSignal({
            roomId,
            fromUserId: userId,
            toUserId: otherUserId,
            type: "offer",
            payload: pc.localDescription,
          });
        } catch (err) {
          console.error("Negotiation failed:", err);
        }
      };

      return pc;
    },
    [localStream, roomId, userId, sendSignal, speakerEnabled]
  );

  // ---------- Maintain peer map based on presence ----------
  useEffect(() => {
    // listPresence is reactive (useQuery). It returns presence rows for the room.
    if (!listPresence) return;
    const currentUserIds = new Set(listPresence.map((p: any) => p.userId));
    // create peer connections for others
    for (const p of listPresence) {
      const otherId: Id<"users"> = p.userId;
      if (otherId === userId) continue;
      if (!peersRef.current.has(otherId)) {
        const pc = createPeerConnection(otherId);
        peersRef.current.set(otherId, { userId: otherId, pc });
      }
    }
    // cleanup peers for users who left
    for (const [peerId, peer] of peersRef.current.entries()) {
      if (!currentUserIds.has(peerId)) {
        try {
          peer.pc.close();
        } catch (e) {
          console.error(e);
        }
        peersRef.current.delete(peerId);
        const el = remoteAudioElementsRef.current.get(peerId);
        if (el) {
          el.pause();
          el.srcObject = null;
          remoteAudioElementsRef.current.delete(peerId);
        }
      }
    }
  }, [listPresence, createPeerConnection, userId]);

  // ---------- Handle incoming signals ----------
  useEffect(() => {
    if (!incomingSignals || incomingSignals.length === 0) return;
    (async () => {
      for (const sig of incomingSignals) {
        // Basic TTL guard
        if (Date.now() - sig.createdAt > SIGNAL_TTL_MS) {
          // optionally delete stale signal
          await deleteSignal({ signalId: sig._id }).catch(() => {});
          continue;
        }

        const fromId = sig.fromUserId as Id<"users">;
        const type = sig.type as "offer" | "answer" | "ice";
        const payload = sig.payload;

        let peer = peersRef.current.get(fromId);
        if (!peer) {
          const pc = createPeerConnection(fromId);
          peer = { userId: fromId, pc };
          peersRef.current.set(fromId, peer);
        }
        const pc = peer.pc;

        if (type === "offer") {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload));
            // add any queued ICE candidates for this peer
            const pending = pendingIceRef.current.get(fromId) || [];
            for (const c of pending) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(c));
              } catch (e) {
                console.warn(e);
              }
            }
            pendingIceRef.current.delete(fromId);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await sendSignal({
              roomId,
              fromUserId: userId,
              toUserId: fromId,
              type: "answer",
              payload: pc.localDescription,
            });
          } catch (err) {
            console.error("Error handling offer:", err);
          }
        } else if (type === "answer") {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload));
            // flush candidates
            const pending = pendingIceRef.current.get(fromId) || [];
            for (const c of pending) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(c));
              } catch (e) {
                console.warn(e);
              }
            }
            pendingIceRef.current.delete(fromId);
          } catch (err) {
            console.error("Error applying answer:", err);
          }
        } else if (type === "ice") {
          const candidate = payload as RTCIceCandidateInit;
          // If remote description not set yet, queue
          if (!pc.remoteDescription || pc.remoteDescription.type === null) {
            const arr = pendingIceRef.current.get(fromId) ?? [];
            arr.push(candidate);
            pendingIceRef.current.set(fromId, arr);
          } else {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn("addIceCandidate failed:", err);
            }
          }
        }

        // delete signal after processing
        await deleteSignal({ signalId: sig._id }).catch(() => {});
      }
    })();
  }, [
    incomingSignals,
    createPeerConnection,
    sendSignal,
    deleteSignal,
    roomId,
    userId,
  ]);

  // ---------- Mic toggle (updates tracks and causes renegotiation) ----------
  const toggleMicrophone = useCallback(async () => {
    if (!localStream) {
      console.warn("No local stream");
      return;
    }
    const newState = !micEnabled;
    setMicEnabled(newState);
    localStream.getAudioTracks().forEach((track) => (track.enabled = newState));

    if (newState) {
      // If microphone is enabled and peers exist, add tracks and renegotiate
      for (const { pc } of peersRef.current.values()) {
        // addTrack will likely trigger onnegotiationneeded automatically
        try {
          localStream
            .getAudioTracks()
            .forEach((track) => pc.addTrack(track, localStream));
        } catch (e) {
          console.error(e);
          // ignore duplicates
        }
      }
    } else {
      // Removing tracks is tricky: browsers don't expose removeTrack by track easily.
      // We'll rely on renegotiation by creating a new offer without the track if needed.
      // For simplicity, we just disable the tracks (already done), and peers will stop receiving audio.
    }
  }, [localStream, micEnabled]);

  // ---------- Speaker toggle ----------
  const toggleSpeaker = useCallback(() => {
    const newState = !speakerEnabled;
    setSpeakerEnabled(newState);
    remoteAudioElementsRef.current.forEach((el) => {
      el.volume = newState ? 1 : 0;
    });
  }, [speakerEnabled]);

  // ---------- Join / user gesture (ensures autoplay allowed) ----------
  const joinVoice = useCallback(async () => {
    // user must gesture (click) to allow audio playback in browsers
    // This function should be called from a click handler.
    if (!localStream) {
      await initLocalStream();
    }
    // try to play any existing audio elements to satisfy autoplay policies
    remoteAudioElementsRef.current.forEach((el) => {
      // attempt to play (may fail silently)
      el.play().catch(() => {});
    });

    setJoined(true);

    // Optionally run a cleanup occasionally
    cleanupOldSignals().catch(() => {});
  }, [initLocalStream, localStream, cleanupOldSignals]);

  // ---------- Cleanup on unmount ----------
  useEffect(() => {
    return () => {
      // stop audio analysis
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioContextRef.current)
        audioContextRef.current.close().catch(() => {});

      // stop tracks
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      // close peer connections
      for (const p of peersRef.current.values()) {
        try {
          p.pc.close();
        } catch (e) {
          console.error(e);
        }
      }
      peersRef.current.clear();
      remoteAudioElementsRef.current.forEach((el) => {
        el.pause();
        el.srcObject = null;
      });
      remoteAudioElementsRef.current.clear();
    };
  }, [localStream]);

  // auto-init local stream in the background (does not start microphone)
  useEffect(() => {
    // try to get media on mount (will prompt for permission).
    // If you prefer to only ask on user gesture, comment this out.
    initLocalStream().catch(() => {});
  }, [initLocalStream]);

  return {
    // state
    micEnabled,
    speakerEnabled,
    isConnecting,
    isSpeaking,
    error,
    joined,

    // actions
    joinVoice, // must be called from a user gesture (click)
    toggleMicrophone,
    toggleSpeaker,
  };
}
