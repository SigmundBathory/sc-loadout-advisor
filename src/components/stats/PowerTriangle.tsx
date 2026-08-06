"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import { useThemeTokens } from "@/components/providers/ThemeProvider";

interface PowerTriangleProps {
  weaponsPower: number;
  shieldsPower: number;
  enginesPower: number;
  className?: string;
  size?: number;
  interactive?: boolean;
}

export default function PowerTriangle({
  weaponsPower,
  shieldsPower,
  enginesPower,
  className = "",
  size = 280,
  interactive = false,
}: PowerTriangleProps) {
  const { colors } = useThemeTokens();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredVertex, setHoveredVertex] = useState<"weapons" | "shields" | "engines" | null>(null);
  const [animProgress, setAnimProgress] = useState(0);

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.42;

  const vertices = {
    weapons: {
      x: centerX,
      y: centerY - radius,
      label: "Armas",
      short: "ARMAS",
      color: colors.engine[500],
      glowColor: colors.engine[400],
      value: weaponsPower,
    },
    shields: {
      x: centerX - radius * Math.sin(Math.PI / 3),
      y: centerY + radius * Math.cos(Math.PI / 3),
      label: "Escudos",
      short: "ESCUDOS",
      color: colors.shield[500],
      glowColor: colors.shield[400],
      value: shieldsPower,
    },
    engines: {
      x: centerX + radius * Math.sin(Math.PI / 3),
      y: centerY + radius * Math.cos(Math.PI / 3),
      label: "Motores",
      short: "MOTORES",
      color: colors.quantum[500],
      glowColor: colors.quantum[400],
      value: enginesPower,
    },
  };

  useEffect(() => {
    let startTime: number;
    const animateProgress = () => {
      if (!startTime) startTime = performance.now();
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / 800, 1);
      setAnimProgress(progress);
      if (progress < 1) {
        requestAnimationFrame(animateProgress);
      }
    };
    requestAnimationFrame(animateProgress);
  }, []);

  const drawTriangle = (ctx: CanvasRenderingContext2D) => {
    const { weapons, shields, engines } = vertices;

    ctx.beginPath();
    ctx.moveTo(weapons.x, weapons.y);
    ctx.lineTo(shields.x, shields.y);
    ctx.lineTo(engines.x, engines.y);
    ctx.closePath();
    ctx.fillStyle = colors.semantic.surface.primary;
    ctx.fill();
    ctx.strokeStyle = colors.semantic.border.primary;
    ctx.lineWidth = 1;
    ctx.stroke();

    const powerVertices = [
      { x: centerX, y: centerY - radius * (weaponsPower / 100) * animProgress },
      {
        x: centerX - radius * Math.sin(Math.PI / 3) * (shieldsPower / 100) * animProgress,
        y: centerY + radius * Math.cos(Math.PI / 3) * (shieldsPower / 100) * animProgress,
      },
      {
        x: centerX + radius * Math.sin(Math.PI / 3) * (enginesPower / 100) * animProgress,
        y: centerY + radius * Math.cos(Math.PI / 3) * (enginesPower / 100) * animProgress,
      },
    ];

    ctx.beginPath();
    ctx.moveTo(powerVertices[0].x, powerVertices[0].y);
    ctx.lineTo(powerVertices[1].x, powerVertices[1].y);
    ctx.lineTo(powerVertices[2].x, powerVertices[2].y);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(centerX, centerY - radius, centerX, centerY + radius);
    gradient.addColorStop(0, `${colors.engine[500]}60`);
    gradient.addColorStop(0.5, `${colors.shield[500]}60`);
    gradient.addColorStop(1, `${colors.quantum[500]}60`);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = colors.semantic.border.primary;
    ctx.lineWidth = 2;
    ctx.stroke();

    Object.entries(vertices).forEach(([key, v]) => {
      const isHovered = interactive && hoveredVertex === key;
      const pulse = isHovered ? 1.3 : 1;
      if (isHovered || v.value > 80) {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 18 * pulse * animProgress, 0, Math.PI * 2);
        const glowGradient = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, 20 * pulse);
        glowGradient.addColorStop(0, `${v.glowColor}40`);
        glowGradient.addColorStop(1, `${v.glowColor}00`);
        ctx.fillStyle = glowGradient;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(v.x, v.y, 12 * animProgress, 0, Math.PI * 2);
      ctx.fillStyle = v.color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(v.x - 3, v.y - 3, 4 * animProgress, 0, Math.PI * 2);
      ctx.fillStyle = `${v.color}CC`;
      ctx.fill();
      ctx.font = `bold ${14 * animProgress}px "JetBrains Mono", monospace`;
      ctx.fillStyle = colors.semantic.text.primary;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round(v.value * animProgress)}%`, v.x, v.y);
    });

    ctx.strokeStyle = `${colors.semantic.border.secondary}40`;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    Object.values(vertices).forEach((v) => {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(v.x, v.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(centerX, centerY, 6 * animProgress, 0, Math.PI * 2);
    ctx.fillStyle = colors.semantic.text.muted;
    ctx.fill();
  };

  const drawTriangleRef = useRef(drawTriangle);
  useEffect(() => {
    drawTriangleRef.current = drawTriangle;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;
    const render = () => {
      drawTriangleRef.current(ctx);
      frameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frameId);
  }, [animProgress, hoveredVertex, weaponsPower, shieldsPower, enginesPower]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    let found = false;
    Object.entries(vertices).forEach(([key, v]) => {
      const dx = mouseX - v.x;
      const dy = mouseY - v.y;
      if (dx * dx + dy * dy < 20 * 20) {
        setHoveredVertex(key as "weapons" | "shields" | "engines");
        found = true;
      }
    });
    if (!found) setHoveredVertex(null);
  };

  const handleMouseLeave = () => setHoveredVertex(null);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-crosshair"
      />
      {interactive && hoveredVertex && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs font-mono text-white pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${vertices[hoveredVertex].color}CC, ${vertices[hoveredVertex].glowColor}80)`,
            border: `1px solid ${vertices[hoveredVertex].glowColor}60`,
            boxShadow: `0 8px 32px ${vertices[hoveredVertex].color}40`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold">{vertices[hoveredVertex].short}</span>
            <span className="text-muted-foreground">{Math.round(vertices[hoveredVertex].value)}%</span>
          </div>
          <div className="text-[10px] opacity-70">Potencia asignada al sistema</div>
        </motion.div>
      )}

      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border/30">
        {Object.entries(vertices).map(([key, v]) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * ["weapons", "shields", "engines"].indexOf(key) }}
            className="flex items-center gap-2 text-xs"
          >
            <span className="w-3 h-3 rounded-full" style={{ background: v.color, boxShadow: `0 0 8px ${v.glowColor}60` }} />
            <span className="font-medium text-foreground">{v.short}</span>
            <span className="font-mono text-primary" style={{ color: v.color }}>{v.value}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
