"use client";

import { useEffect } from "react";
import { injectThemeCSS } from "@/components/providers/ThemeProvider";

export default function ThemeInitializer() {
  useEffect(() => {
    injectThemeCSS();
  }, []);

  return null;
}