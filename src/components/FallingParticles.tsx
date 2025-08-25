import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  petalCount: number;
  shapeSeed: number; // for variability
};

export type FallingParticlesProps = {
  /** how long the effect should run (ms) */
  durationMs?: number;
  /** max number of active particles */
  particleCount?: number;
  /** optional list of colors to pick from */
  colors?: string[];
  /** range for particle size (px) */
  sizeRange?: [number, number];
  /** should the canvas cover the whole viewport? default true. If false, it fills parent. */
  fullScreen?: boolean;
  /** pointer-events none so it doesn't block clicks (default true) */
  pointerEventsNone?: boolean;
  /** optional zIndex */
  zIndex?: number;
};

const defaultColors = [
  "#ff6b6b",
  "#ffb86b",
  "#ffd86b",
  "#6bffb8",
  "#6bdfff",
  "#6b89ff",
  "#c86bff",
];

export const FallingParticles: React.FC<FallingParticlesProps> = ({
  durationMs = 4000,
  particleCount = 40,
  colors = defaultColors,
  sizeRange = [12, 30],
  fullScreen = true,
  pointerEventsNone = true,
  zIndex = 1000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const stopTimeoutRef = useRef<number | null>(null);
  const runningRef = useRef<boolean>(true);

  // Extract complex dependencies to variables for useEffect
  const colorsString = JSON.stringify(colors);
  const sizeRangeString = sizeRange.join(",");

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let width = (canvas.width = fullScreen
      ? window.innerWidth
      : canvas.clientWidth);
    let height = (canvas.height = fullScreen
      ? window.innerHeight
      : canvas.clientHeight);

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * devicePixelRatio);
    canvas.height = Math.round(height * devicePixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const rand = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const createParticle = (): Particle => {
      const size = rand(sizeRange[0], sizeRange[1]);
      return {
        x: rand(0, width),
        y: rand(-height * 0.2, 0),
        vx: rand(-0.4, 0.4),
        vy: rand(0.8, 2.2),
        size,
        rotation: rand(0, Math.PI * 2),
        rotSpeed: rand(-0.03, 0.03),
        color: colors[Math.floor(Math.random() * colors.length)],
        petalCount: Math.floor(rand(4, 7)),
        shapeSeed: Math.random(),
      };
    };

    particlesRef.current = new Array(particleCount)
      .fill(0)
      .map(() => createParticle());

    const drawFlower = (p: Particle) => {
      const { x, y, size, rotation, color, petalCount } = p;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // petal parameters
      const petalLen = size;
      const petalW = size * 0.5;
      ctx.globalAlpha = 0.95;

      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        ctx.save();
        ctx.rotate(angle);
        // draw petal as ellipse
        ctx.beginPath();
        ctx.ellipse(
          petalLen * 0.45,
          0,
          petalLen,
          petalW,
          Math.PI / 6,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
      }

      // center
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, size * 0.18), 0, Math.PI * 2);
      ctx.fillStyle = "#fffecf";
      ctx.fill();
      ctx.closePath();

      ctx.restore();
    };

    const update = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        drawFlower(p);

        // recycle off-screen
        if (p.y - p.size > height + 50) {
          Object.assign(p, createParticle(), { y: -20, x: rand(0, width) });
        }
        // wrap left/right
        if (p.x < -50) p.x = width + 50;
        if (p.x > width + 50) p.x = -50;
      }

      if (runningRef.current) {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    rafRef.current = requestAnimationFrame(update);

    // stop after durationMs
    stopTimeoutRef.current = window.setTimeout(() => {
      // stop animating and clear canvas after short fade
      runningRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // clear
      ctx.clearRect(0, 0, width, height);
    }, durationMs);

    const onResize = () => {
      width = canvas.width = fullScreen
        ? window.innerWidth
        : canvas.clientWidth;
      height = canvas.height = fullScreen
        ? window.innerHeight
        : canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener("resize", onResize);

    return () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
      window.removeEventListener("resize", onResize);
      ctx.clearRect(0, 0, width, height);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMs, particleCount, colorsString, sizeRangeString, fullScreen]);

  const style: React.CSSProperties = {
    position: fullScreen ? "fixed" : "absolute",
    left: 0,
    top: 0,
    width: fullScreen ? "100vw" : "100%",
    height: fullScreen ? "100vh" : "100%",
    pointerEvents: pointerEventsNone ? "none" : "auto",
    zIndex,
    overflow: "hidden",
  };

  return <canvas ref={canvasRef} style={style} aria-hidden />;
};

export default FallingParticles;
