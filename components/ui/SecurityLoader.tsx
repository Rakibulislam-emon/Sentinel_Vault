"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, Cpu, Activity } from "lucide-react";
import { useEffect, useState } from "react";

export default function SecurityLoader() {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("INITIALIZING SENTINEL...");

  useEffect(() => {
    // Check if we already showed it this session
    const hasSeenLoader = sessionStorage.getItem("hasSeenSecurityLoader");
    if (hasSeenLoader) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    const stages = [
      "INITIALIZING SENTINEL PROTOCOLS...",
      "ESTABLISHING SECURE TUNNEL...",
      "VERIFYING INTEGRITY...",
      "SYNCING ENCRYPTION KEYS...",
      "ACCESS GRANTED",
    ];

    let currentStage = 0;
    const startTime = Date.now();
    const duration = 2500; // Total duration in ms

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);

      setProgress(newProgress);

      const stageIndex = Math.min(
        Math.floor((newProgress / 100) * stages.length),
        stages.length - 1
      );

      if (stageIndex > currentStage) {
        currentStage = stageIndex;
        setStatusText(stages[currentStage]);
      }

      if (newProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsVisible(false);
          sessionStorage.setItem("hasSeenSecurityLoader", "true");
        }, 600);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="security-loader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.1,
            transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] },
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
        >
          {/* Cyberpunk Grid Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b9811a_1px,transparent_1px),linear-gradient(to_bottom,#10b9811a_1px,transparent_1px)] bg-[size:50px_50px]" />
            <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent" />
          </div>

          {/* Animated Scanning Ring */}
          <div className="relative flex items-center justify-center mb-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute w-72 h-72 rounded-full border border-dashed border-emerald-500/30"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute w-80 h-80 rounded-full border border-dotted border-emerald-500/20"
            />

            {/* Core Shield */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                filter: [
                  "drop-shadow(0 0 10px rgba(16,185,129,0.3))",
                  "drop-shadow(0 0 30px rgba(16,185,129,0.6))",
                  "drop-shadow(0 0 10px rgba(16,185,129,0.3))",
                ],
              }}
              transition={{
                scale: { duration: 0.5 },
                filter: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
              className="relative z-10 p-8 rounded-3xl bg-black/40 border border-emerald-500/40 backdrop-blur-2xl shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]"
            >
              <Shield className="w-20 h-20 text-emerald-500" />
            </motion.div>

            {/* Orbital Dots */}
            {[0, 90, 180, 270].map((angle, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"
                animate={{
                  rotate: [angle, angle + 360],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                style={{
                  originX: "50%",
                  originY: "50%",
                  transform: `rotate(${angle}deg) translateY(-140px)`,
                }}
              />
            ))}
          </div>

          {/* Loading Progress Section */}
          <div className="relative z-10 w-full max-w-md px-10">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex justify-between items-end">
                <motion.span
                  key={statusText}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[11px] font-mono tracking-[0.25em] text-emerald-500 font-bold"
                >
                  {statusText}
                </motion.span>
                <span className="text-xs font-mono text-emerald-500/90 font-bold">
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="h-1 w-full bg-emerald-950/50 rounded-full overflow-hidden border border-emerald-500/20">
                <motion.div
                  className="h-full bg-emerald-500 relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.1 }}
                >
                  {/* Glow effect at the tip of the bar */}
                  <div className="absolute right-0 top-0 bottom-0 w-4 shadow-[0_0_15px_#10b981] bg-emerald-400" />
                </motion.div>
              </div>
            </div>

            {/* System Specs Micro-Display */}
            <div className="grid grid-cols-2 gap-6 mt-12 border-t border-emerald-500/10 pt-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Cpu className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-mono text-emerald-500/50 uppercase tracking-tighter">
                    Encryption Standard
                  </span>
                  <span className="text-[9px] font-mono text-white/80 font-bold uppercase tracking-widest">
                    AES-256-GCM
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-mono text-emerald-500/50 uppercase tracking-tighter">
                    Security Model
                  </span>
                  <span className="text-[9px] font-mono text-white/80 font-bold uppercase tracking-widest">
                    ZERO-KNOWLEDGE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Data Bits */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * 100 + "%",
                  y: "110%",
                  opacity: 0,
                }}
                animate={{
                  y: "-10%",
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: Math.random() * 5 + 5,
                  repeat: Infinity,
                  delay: Math.random() * 10,
                }}
                className="absolute text-[8px] font-mono text-emerald-500"
              >
                {Math.random().toString(16).substring(2, 6).toUpperCase()}
              </motion.div>
            ))}
          </div>

          {/* Scan Line */}
          <motion.div
            animate={{ top: ["-10%", "110%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[2px] bg-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.5)] z-20 pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
