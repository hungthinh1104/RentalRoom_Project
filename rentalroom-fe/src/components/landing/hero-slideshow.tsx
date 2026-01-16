"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    }, []);

    return (
        <div className="absolute inset-0 -z-10 bg-zinc-900 overflow-hidden">
            {/* Image Slider */}
            <AnimatePresence mode="popLayout">
                <motion.img
                    key={currentImage}
                    src={images[currentImage]}
                    alt="Rental Room Background"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </AnimatePresence>

            {/* Overlays for readability */}
            {/* Dark gradient from bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />

            {/* Radial gradient to focus center */}
            <div className="absolute inset-0 bg-radial-gradient-to-t from-transparent to-background/80 opacity-60" />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] mix-blend-overlay" />
        </div>
    );
}
