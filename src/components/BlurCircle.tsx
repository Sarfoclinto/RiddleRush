type BlurCircleProps = {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  animate?: boolean;
  type?: "bounce" | "ping" | "pulse" | "spin";
  size?: "sm" | "md" | "lg" | "xl";
};
const BlurCircle = ({
  top = "auto",
  left = "auto",
  right = "auto",
  bottom = "auto",
  animate = false,
  type = "pulse",
  size = "md",
}: BlurCircleProps) => {
  const getCircleSize = (size: string) => {
    switch (size) {
      case "sm":
        return "size-32";
      case "md":
        return "size-58";
      case "lg":
        return "size-72";
      case "xl":
        return "size-92";
      default:
        return "size-58";
    }
  };

  const circleSize = getCircleSize(size);
  return (
    <div
      className={`absolute -z-50 ${circleSize} aspect-square rounded-full bg-primary/30 blur-3xl ${animate && "animate-" + type}`}
      style={{
        top,
        bottom,
        left,
        right,
      }}
    ></div>
  );
};
export default BlurCircle;
