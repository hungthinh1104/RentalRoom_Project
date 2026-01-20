"use client";
import { motion } from "framer-motion";

export function AuthBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none bg-zinc-950">
            {/* Cinematic Gradient Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                    rotate: [0, 20, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute -top-[30%] -left-[10%] w-[1000px] h-[1000px] rounded-full bg-indigo-500/20 blur-[150px] mix-blend-screen"
            />

            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.15, 0.3, 0.15],
                    x: [0, 50, 0],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-[20%] -right-[20%] w-[800px] h-[800px] rounded-full bg-rose-500/10 blur-[180px] mix-blend-screen"
            />

            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.1, 0.2, 0.1],
                    y: [0, -50, 0],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute -bottom-[20%] left-[20%] w-[900px] h-[900px] rounded-full bg-blue-600/10 blur-[160px] mix-blend-screen"
            />

            {/* Noise Texture for Film Grain Effect */}
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.04] mix-blend-overlay" />

            {/* Grid Pattern Overlay - Subtle Tech Feel */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.02]" />
        </div>
    );
}
