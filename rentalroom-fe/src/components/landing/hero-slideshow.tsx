"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function HeroSlideshow() {
    const [currentImage, setCurrentImage] = React.useState(0);

    const images = [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop", // Living Room
        "https://images.unsplash.com/photo-1484154218962-a1c002085aac?q=80&w=2070&auto=format&fit=crop", // Kitchen
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop", // Bedroom
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop", // Modern House
    ];

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % images.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [images.length]);

    return (
        <div className="absolute inset-0 -z-10 bg-zinc-900 overflow-hidden">
            {/* Image Slider - Optimized from AuthFeatureShowcase */}
            <div className="absolute inset-0">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentImage}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute inset-0 w-full h-full will-change-transform"
                    >
                        <Image
                            src={images[currentImage]}
                            alt="Background"
                            fill
                            className="object-cover"
                            priority
                        />
                    </motion.div>
                </AnimatePresence>
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            </div>

            {/* Additional Hero Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] mix-blend-overlay" />
        </div>
    );
}
