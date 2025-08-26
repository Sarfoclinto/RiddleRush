import { useAudioChat } from "@/hooks/useAudioChat";
import { cn } from "@/utils/cn";
import { Loader2, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import type { Id } from "myconvex/_generated/dataModel";

type AudioControlProps = {
  roomId: Id<"rooms">;
  userId: Id<"users">;
  className?: string;
};
const AudioControl = ({ roomId, userId, className }: AudioControlProps) => {
  const {
    micEnabled,
    speakerEnabled,
    isConnecting,
    isSpeaking,
    //   error,
    //   joined,
    //   joinVoice,
    toggleMicrophone,
    toggleSpeaker,
  } = useAudioChat(roomId, userId);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Microphone Control */}
      <button
        onClick={toggleMicrophone}
        disabled={isConnecting}
        className={cn(
          "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          micEnabled
            ? "bg-green-500 hover:bg-green-600 focus:ring-green-500 text-white"
            : "bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white",
          isSpeaking && micEnabled && "ring-4 ring-green-300 animate-pulse",
          isConnecting && "opacity-50 cursor-not-allowed"
        )}
        title={micEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        {isConnecting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : micEnabled ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5" />
        )}

        {/* Speaking indicator */}
        {isSpeaking && micEnabled && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
        )}
      </button>

      {/* Speaker Control */}
      <button
        onClick={toggleSpeaker}
        disabled={isConnecting}
        className={cn(
          "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          speakerEnabled
            ? "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 text-white"
            : "bg-gray-500 hover:bg-gray-600 focus:ring-gray-500 text-white",
          isConnecting && "opacity-50 cursor-not-allowed"
        )}
        title={speakerEnabled ? "Mute speakers" : "Unmute speakers"}
      >
        {speakerEnabled ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};
export default AudioControl;
