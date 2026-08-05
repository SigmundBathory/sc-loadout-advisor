"use client";

export default function StarBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-900/15 via-indigo-950/10 to-transparent blur-[120px] rounded-full" />
      <div className="absolute top-[30%] left-[-10%] w-[600px] h-[600px] bg-cyan-900/10 blur-[140px] rounded-full" />
      <div className="absolute top-[60%] right-[-10%] w-[700px] h-[700px] bg-purple-900/10 blur-[160px] rounded-full" />

      {/* Sci-fi Grid Lines overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
}
