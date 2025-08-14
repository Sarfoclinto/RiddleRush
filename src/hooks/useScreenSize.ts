import { useEffect, useState } from "react";

type DeviceType = "mobile" | "tablet" | "desktop" | "large-desktop";

interface ScreenSize {
  width: number;
  height: number;
  device: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;

  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
}

const getDeviceType = (width: number): DeviceType => {
  if (width < 640) return "mobile";
  if (width >= 640 && width < 1024) return "tablet";
  if (width >= 1024 && width < 1280) return "desktop";
  return "large-desktop";
};

const useScreenSize = (): ScreenSize => {
  const getSize = (): ScreenSize => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const device = getDeviceType(width);

    return {
      width,
      height,
      device,

      isMobile: width < 640,
      isTablet: width >= 640 && width < 1024,
      isDesktop: width >= 1024 && width < 1280,
      isLargeDesktop: width >= 1280,

      isSm: width >= 640,
      isMd: width >= 768,
      isLg: width >= 1024,
      isXl: width >= 1280,
      is2xl: width >= 1536,
    };
  };

  const [screenSize, setScreenSize] = useState<ScreenSize>(getSize());

  useEffect(() => {
    const handleResize = () => setScreenSize(getSize());

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
};

export default useScreenSize;
