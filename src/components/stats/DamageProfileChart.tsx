"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import { useThemeTokens } from "@/components/providers/ThemeProvider";

interface WeaponProfile {
  name: string;
  type: string;
  dps: number;
  range: number;
  falloffStart: number;
  falloffEnd: number;
  color: string;
}

interface DamageProfileChartProps {
  weapons: WeaponProfile[];
  className?: string;
  width?: number;
  height?: number;
  showFalloff?: boolean;
}

export default function DamageProfileChart({
  weapons,
  className = "",
  width = 500,
  height = 300,
  showFalloff = true,
}: DamageProfileChartProps) {
  const { colors } = useThemeTokens();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredWeapon, setHoveredWeapon] = useState<string | null>(null);
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animateProgress = () => {
      if (!startTime) startTime = performance.now();
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / 1000, 1);
      setAnimProgress(progress);
      if (progress < 1) {
        requestAnimationFrame(animateProgress);
      }
    };
    requestAnimationFrame(animateProgress);
  }, []);

  const maxRange = Math.max(...weapons.map((w) => w.falloffEnd || w.range), 1000);
  const maxDPS = Math.max(...weapons.map((w) => w.dps), 1);

  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const xScale = (dist: number) => padding.left + (dist / maxRange) * plotWidth;
  const yScale = (dps: number) => padding.top + plotHeight - (dps / maxDPS) * plotHeight * 0.9;

  const drawChart = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = `${colors.semantic.border.primary}20`;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = padding.left + (i / 5) * plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i / 4) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    ctx.strokeStyle = colors.semantic.border.primary;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    ctx.font = `11px "JetBrains Mono", monospace`;
    ctx.fillStyle = colors.semantic.text.muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let i = 0; i <= 4; i++) {
      const dps = Math.round(maxDPS * (1 - i / 4));
      const y = padding.top + (i / 4) * plotHeight;
      ctx.fillText(`${dps.toLocaleString()}`, padding.left - 35, y - 6);
    }
    ctx.fillText("DPS", padding.left - 35, padding.top - 20);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= 5; i++) {
      const dist = Math.round((i / 5) * maxRange);
      const x = padding.left + (i / 5) * plotWidth;
      ctx.fillText(`${dist}m`, x, height - padding.bottom + 10);
    }
    ctx.fillText("Distancia (m)", width / 2, height - 8);

    if (showFalloff) {
      weapons.forEach((w) => {
        if (w.falloffStart && w.falloffEnd && w.falloffEnd > w.falloffStart) {
          const startX = xScale(w.falloffStart);
          const endX = xScale(w.falloffEnd);
          const gradient = ctx.createLinearGradient(startX, padding.top, endX, padding.top);
          gradient.addColorStop(0, `${w.color}30`);
          gradient.addColorStop(0.5, `${w.color}15`);
          gradient.addColorStop(1, `${w.color}05`);
          ctx.fillStyle = gradient;
          ctx.fillRect(startX, padding.top, endX - startX, plotHeight);
        }
      });
    }

    weapons.forEach((weapon) => {
      const isHovered = hoveredWeapon === weapon.name;
      const points: { x: number; y: number }[] = [];
      const steps = 50;
      for (let i = 0; i <= steps; i++) {
        const dist = (i / steps) * maxRange;
        let dps = weapon.dps;
        if (weapon.falloffStart && weapon.falloffEnd) {
          if (dist > weapon.falloffStart) {
            const falloffRatio = Math.min(1, (dist - weapon.falloffStart) / (weapon.falloffEnd - weapon.falloffStart));
            dps = weapon.dps * (1 - falloffRatio * 0.5);
          }
        } else if (dist > weapon.range) {
          dps = weapon.dps * 0.5;
        }
        points.push({ x: xScale(dist), y: yScale(dps * animProgress) });
      }

      ctx.beginPath();
      ctx.moveTo(points[0].x, height - padding.bottom);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
      ctx.closePath();

      const fillGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      fillGradient.addColorStop(0, `${weapon.color}${isHovered ? "40" : "20"}`);
      fillGradient.addColorStop(1, `${weapon.color}00`);
      ctx.fillStyle = fillGradient;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = weapon.color;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();

      points.forEach((p, i) => {
        if (i % 5 === 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, isHovered ? 5 : 3, 0, Math.PI * 2);
          ctx.fillStyle = weapon.color;
          ctx.fill();
          ctx.strokeStyle = colors.semantic.bg.primary;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
    });

    if (hoveredWeapon) {
      const weapon = weapons.find((w) => w.name === hoveredWeapon);
      if (weapon) {
        const tooltipX = xScale(weapon.range * 0.5);
        const tooltipY = yScale(weapon.dps * 0.5);

        ctx.font = "bold 12px 'JetBrains Mono', monospace";
        ctx.fillStyle = colors.semantic.bg.primary;
        ctx.textAlign = "left";

        const lines = [
          weapon.name,
          `${weapon.dps.toLocaleString()} DPS base`,
          `Alcance: ${weapon.range}m`,
          weapon.falloffStart ? `Falloff: ${weapon.falloffStart}m - ${weapon.falloffEnd}m` : "Sin falloff",
        ];

        const maxWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
        const boxWidth = maxWidth + 24;
        const boxHeight = lines.length * 20 + 16;
        const boxX = Math.min(tooltipX + 20, width - padding.right - boxWidth - 10);
        const boxY = Math.max(tooltipY - boxHeight / 2, padding.top + 10);

        ctx.fillStyle = `${colors.semantic.surface.primary}EE`;
        ctx.strokeStyle = weapon.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const r = 8;
        ctx.moveTo(boxX + r, boxY);
        ctx.lineTo(boxX + boxWidth - r, boxY);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + r);
        ctx.lineTo(boxX + boxWidth, boxY + boxHeight - r);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - r, boxY + boxHeight);
        ctx.lineTo(boxX + r, boxY + boxHeight);
        ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - r);
        ctx.lineTo(boxX, boxY + r);
        ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = colors.semantic.text.primary;
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        lines.forEach((line, i) => {
          ctx.fillText(line, boxX + 12, boxY + 12 + i * 20);
        });
      }
    }
  };

  const drawChartRef = useRef(drawChart);
  useEffect(() => {
    drawChartRef.current = drawChart;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;
    const render = () => {
      drawChartRef.current(ctx);
      frameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frameId);
  }, [animProgress, hoveredWeapon, weapons]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    let found = false;
    weapons.forEach((w) => {
      const weaponCenterX = xScale(w.range * 0.5);
      const weaponCenterY = yScale(w.dps * 0.5);
      const dx = mouseX - weaponCenterX;
      const dy = mouseY - weaponCenterY;
      if (dx * dx + dy * dy < 60 * 60) {
        setHoveredWeapon(w.name);
        found = true;
      }
    });
    if (!found) setHoveredWeapon(null);
  };

  const handleMouseLeave = () => setHoveredWeapon(null);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width, height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-crosshair"
      />

      <div className="flex flex-wrap justify-center gap-3 mt-4 pt-4 border-t border-border/30">
        {weapons.map((w, i) => (
          <motion.div
            key={w.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="flex items-center gap-2 text-xs"
          >
            <span className="w-3 h-3 rounded-full" style={{ background: w.color, boxShadow: `0 0 8px ${w.color}60` }} />
            <span className="font-medium text-foreground">{w.name}</span>
            <span className="font-mono text-primary" style={{ color: w.color }}>{w.dps.toLocaleString()} DPS</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
