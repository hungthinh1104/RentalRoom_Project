"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldCheck, Zap, FileCheck, Building2, Users, Star, TrendingUp } from "lucide-react";

export function AuthFeatureShowcase() {
    const features = [
        {
            icon: Search,
            title: "Tìm kiếm AI",
            desc: "Tìm phòng thông minh",
            color: "bg-blue-500/10 text-blue-500",
            delay: 0,
        },
        {
            icon: ShieldCheck,
            title: "An toàn tuyệt đối",
            desc: "Xác thực danh tính",
            color: "bg-green-500/10 text-green-500",
            delay: 0.1,
        },
        {
            icon: Zap,
            title: "Thanh toán nhanh",
            desc: "Tự động hóa 100%",
            color: "bg-yellow-500/10 text-yellow-500",
            delay: 0.2,
        },
        {
            icon: FileCheck,
            title: "Hợp đồng điện tử",
            desc: "Ký kết online",
            color: "bg-purple-500/10 text-purple-500",
            delay: 0.3,
        },
    ];

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
        <div className="relative w-full h-full bg-zinc-900 overflow-hidden">
            {/* Image Slider */}
            <div className="absolute inset-0">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentImage}
                        src={images[currentImage]}
                        alt="Rental Room"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 0.6, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="w-full h-full object-cover"
                    />
                </AnimatePresence>
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between p-12 lg:p-16">
                {/* Brand */}
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Building2 className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">RentalRoom</span>
                </div>

                {/* Content */}
                <div className="space-y-6 max-w-lg">
                    <motion.div
                        key={currentImage}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                            {currentImage === 0 && "Tìm không gian sống lý tưởng của bạn."}
                            {currentImage === 1 && "Quản lý nhà trọ đơn giản & hiệu quả."}
                            {currentImage === 2 && "Kết nối cộng đồng văn minh."}
                        </h1>
                    </motion.div>

                    <p className="text-lg text-zinc-300 leading-relaxed">
                        Nền tảng công nghệ số 1 giúp kết nối Chủ nhà và Người thuê, đơn giản hóa mọi thủ tục từ tìm kiếm, ký hợp đồng đến thanh toán.
                    </p>

                    {/* Stats or Trust Indicators */}
                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 bg-cover bg-center" style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 10})` }} />
                            ))}
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                            </div>
                            <p className="text-sm font-medium text-white">Tin dùng bởi 50,000+ khách hàng</p>
                        </div>
                    </div>
                </div>

                {/* Footer / Copyright */}
                <div className="flex justify-between items-end text-zinc-500 text-xs">
                    <p>© 2026 Rental Room Platform</p>
                    <div className="flex gap-2">
                        <div className="h-1 w-10 bg-zinc-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: '0%' }}
                                transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                                className="h-full w-full bg-white"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
