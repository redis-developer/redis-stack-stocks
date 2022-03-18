import resolveConfig from "tailwindcss/resolveConfig";
import tCfg from "tailwind.config";

export const tailwindConfig = () => {
  // Tailwind config
  return resolveConfig(tCfg as any);
};

export const hexToRGB = (h: string) => {
  let r: string = '0';
  let g: string = '0';
  let b: string = '0';
  if (h.length === 4) {
    r = `0x${h[1]}${h[1]}`;
    g = `0x${h[2]}${h[2]}`;
    b = `0x${h[3]}${h[3]}`;
  } else if (h.length === 7) {
    r = `0x${h[1]}${h[2]}`;
    g = `0x${h[3]}${h[4]}`;
    b = `0x${h[5]}${h[6]}`;
  }
  return `${+r},${+g},${+b}`;
};

export const formatValue = (value: number) =>
  Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    notation: "standard",
  }).format(value);
