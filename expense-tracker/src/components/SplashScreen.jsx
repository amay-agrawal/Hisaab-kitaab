import { useEffect, useState } from "react";

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("enter"); // enter → show → exit

  useEffect(() => {
    // Phase timeline:
    // 0ms   → enter (logo flies in, particles burst)
    // 600ms → show  (pulse, shimmer, tagline fade-in)
    // 2400ms→ exit  (everything fades out, scales down)
    // 3000ms→ done  (parent unmounts splash)
    const t1 = setTimeout(() => setPhase("show"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 2400);
    const t3 = setTimeout(() => onDone(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0f0c29 0%, #1a0533 40%, #0d1b4b 100%)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        opacity: phase === "exit" ? 0 : 1,
        overflow: "hidden",
      }}
    >
      {/* ── Ambient glow orbs ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "15%", left: "20%",
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
          animation: "orbPulse 3s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "15%", right: "15%",
          width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)",
          animation: "orbPulse 3s ease-in-out infinite 1.5s",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
          animation: "orbPulse 4s ease-in-out infinite 0.5s",
        }} />
      </div>

      {/* ── Floating particles ── */}
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 3,
            height: i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 3,
            borderRadius: "50%",
            background: ["#818cf8","#a78bfa","#60a5fa","#34d399","#f472b6"][i % 5],
            left: `${(i * 37 + 5) % 95}%`,
            top: `${(i * 23 + 10) % 90}%`,
            animation: `float ${2.5 + (i % 4) * 0.5}s ease-in-out infinite ${(i * 0.3) % 2}s`,
            opacity: phase === "enter" ? 0 : 0.7,
            transition: "opacity 1s ease",
          }}
        />
      ))}

      {/* ── Grid lines ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }} />

      {/* ── Main logo container ── */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
        transform: phase === "enter" ? "translateY(40px) scale(0.8)" : "translateY(0) scale(1)",
        opacity: phase === "enter" ? 0 : 1,
        transition: "transform 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.6s ease",
        position: "relative", zIndex: 1,
      }}>

        {/* Icon ring */}
        <div style={{ position: "relative" }}>
          {/* Rotating ring */}
          <div style={{
            position: "absolute", inset: -12,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#818cf8",
            borderRightColor: "#a78bfa",
            animation: "spin 2s linear infinite",
          }} />
          {/* Outer glow pulse */}
          <div style={{
            position: "absolute", inset: -20, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
            animation: "logoPulse 2s ease-in-out infinite",
          }} />
          {/* Icon box */}
          <div style={{
            width: 90, height: 90, borderRadius: 24,
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6d28d9 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(124,58,237,0.2)",
            fontSize: 42,
            position: "relative", zIndex: 1,
          }}>
            💰
          </div>
        </div>

        {/* App name */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontSize: 42, fontWeight: 800, letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 30%, #a5b4fc 60%, #818cf8 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: 0, lineHeight: 1.1,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            animation: phase === "show" ? "shimmer 2.5s linear infinite" : "none",
            backgroundSize: "200% 100%",
          }}>
            Hisaab-Kitab
          </h1>
          {/* Tagline */}
          <p style={{
            color: "rgba(148,163,184,0.9)", fontSize: 14, marginTop: 8,
            fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
            opacity: phase === "show" ? 1 : 0,
            transform: phase === "show" ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}>
            Apna Hisaab, Apni Tarakki
          </p>
        </div>

        {/* Animated divider line */}
        <div style={{
          height: 2, borderRadius: 2,
          background: "linear-gradient(90deg, transparent, #818cf8, #a78bfa, transparent)",
          width: phase === "show" ? 280 : 0,
          transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.2s",
        }} />

        {/* Loading dots */}
        <div style={{
          display: "flex", gap: 8,
          opacity: phase === "show" ? 1 : 0,
          transition: "opacity 0.4s ease 0.5s",
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "linear-gradient(135deg, #818cf8, #a78bfa)",
              animation: `dot 1.2s ease-in-out infinite ${i * 0.2}s`,
            }} />
          ))}
        </div>
      </div>

      {/* ── Version badge ── */}
      <div style={{
        position: "absolute", bottom: 32,
        color: "rgba(148,163,184,0.5)", fontSize: 11,
        letterSpacing: "0.1em", fontFamily: "monospace",
        opacity: phase === "show" ? 1 : 0,
        transition: "opacity 0.6s ease 0.8s",
      }}>
        v1.0 &nbsp;·&nbsp; Made with ❤️
      </div>

      {/* ── Keyframe styles injected ── */}
      <style>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(180deg); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes logoPulse {
          0%, 100% { transform: scale(0.95); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}