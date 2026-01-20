"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";

export default function ShowcaseSection() {
    const [currentImage, setCurrentImage] = React.useState(0);

    const images = [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop", // Living Room
        "https://images.unsplash.com/photo-1484154218962-a1c002085aac?q=80&w=2070&auto=format&fit=crop", // Kitchen
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop", // Bedroom
    ];

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative w-full h-[80vh] min-h-[600px] bg-background overflow-hidden translate-y-[-1px]">
            {/* Image Slider */}
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
                        <img
                            src={images[currentImage]}
                            alt="Background"
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </motion.div>
                </AnimatePresence>
                {/* Overlay Gradient (Left & Bottom) */}
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

                {/* Tech Grid Overlay */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03] dark:invert" />
            </div>

            <div className="relative z-10 h-full container mx-auto px-4 flex flex-col justify-center">
                <div className="max-w-2xl space-y-8 pl-4 md:pl-0">
                    <motion.div
                        key={currentImage}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight drop-shadow-sm">
                            {currentImage === 0 && "Không gian sống lý tưởng."}
                            {currentImage === 1 && "Tiện nghi hiện đại."}
                            {currentImage === 2 && "Cộng đồng văn minh."}
                        </h2>
                    </motion.div>

                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light max-w-lg">
                        Trải nghiệm cuộc sống tiện nghi với hệ thống phòng trọ được xác thực, quản lý vận hành chuyên nghiệp và cộng đồng cư dân thân thiện.
                    </p>

                    {/* Trust Indicators */}
                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-2 border-background bg-muted bg-cover bg-center" style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 15})` }} />
                            ))}
                            <div className="w-12 h-12 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                                +2K
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex text-warning">
                                <Star className="w-5 h-5 fill-current" />
                                <Star className="w-5 h-5 fill-current" />
                                <Star className="w-5 h-5 fill-current" />
                                <Star className="w-5 h-5 fill-current" />
                                <Star className="w-5 h-5 fill-current" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Đánh giá 4.9/5 từ cư dân</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
