import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface ThemeCtx {
  color: string; // hex
  setColor: (c: string) => void;
  reset: () => void;
}

const DEFAULT_COLOR = "#5B2A86"; // matches primary 270 65% 28%
const KEY = "ui-primary-color";

const Ctx = createContext<ThemeCtx | null>(null);

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16) / 255;
  const g = parseInt(m.substring(2, 4), 16) / 255;
  const b = parseInt(m.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function applyColor(hex: string) {
  const { h, s, l } = hexToHsl(hex);
  const root = document.documentElement;
  const fgL = l > 55 ? 12 : 95;
  root.style.setProperty("--primary", `${h} ${s}% ${l}%`);
  root.style.setProperty("--primary-foreground", `${h} 30% ${fgL}%`);
  root.style.setProperty("--ring", `${h} ${s}% ${Math.min(l + 7, 70)}%`);
  root.style.setProperty("--accent", `${h} ${Math.min(s + 10, 95)}% ${Math.min(l + 20, 65)}%`);
  root.style.setProperty("--sidebar-primary", `${h} ${s}% ${Math.min(l + 15, 60)}%`);
  root.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg, hsl(${h} ${s}% ${l}%), hsl(${h} ${Math.max(s - 10, 30)}% ${Math.min(l + 12, 55)}%))`
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [color, setColorState] = useState<string>(
    () => localStorage.getItem(KEY) || DEFAULT_COLOR
  );

  useEffect(() => {
    applyColor(color);
    localStorage.setItem(KEY, color);
  }, [color]);

  const setColor = (c: string) => setColorState(c);
  const reset = () => setColorState(DEFAULT_COLOR);

  return <Ctx.Provider value={{ color, setColor, reset }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}

export const PRESET_COLORS = [
  { name: "Royal Purple", hex: "#5B2A86" },
  { name: "Indigo", hex: "#4F46E5" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Teal", hex: "#0D9488" },
  { name: "Green", hex: "#16A34A" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Red", hex: "#DC2626" },
  { name: "Pink", hex: "#DB2777" },
];
