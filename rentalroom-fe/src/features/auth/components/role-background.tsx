"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Home, Building2, Search, ShieldCheck, Zap, FileCheck, CheckCircle2 } from "lucide-react";
import { UserRole } from "@/types";

interface RoleBackgroundProps {
    role: UserRole.TENANT | UserRole.LANDLORD;
}

const roleConfig = {
    TENANT: {
        color: "text-info",
        bgColor: "bg-info/10",
        gradient: "from-blue-500/20 to-cyan-400/20",
        icon: Home,
        title: "Người thuê",
        description: "Tìm kiếm không gian sống lý tưởng",
        features: [
            { icon: Search, text: "Tìm phòng thông minh với AI" },
            { icon: ShieldCheck, text: "Hợp đồng pháp lý minh bạch" },
            { icon: Zap, text: "Thanh toán hóa đơn tự động" },
        ],
    },
    LANDLORD: {
        color: "text-chart-2",
        bgColor: "bg-chart-2/10",
        gradient: "from-orange-500/20 to-amber-400/20",
        icon: Building2,
        title: "Chủ nhà",
        description: "Quản lý toà nhà & cư dân hiệu quả",
        features: [
            { icon: FileCheck, text: "Quản lý hợp đồng số hoá" },
            { icon: Zap, text: "Theo dõi dòng tiền thu chi" },
            { icon: Search, text: "Tìm kiếm khách thuê uy tín" },
        ],
    },
};

export function RoleBackground({ role }: RoleBackgroundProps) {
    const config = roleConfig[role];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 select-none bg-zinc-950 transition-colors duration-1000">
            <AnimatePresence mode="wait">
                <motion.div
                    key={role}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="relative w-full h-full"
                >
                    {/* 1. Cinematic Gradients */}
                    <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${config.gradient} opacity-20 mix-blend-screen transition-all duration-1000`} />

                    {/* Ambient Orbs */}
                    <div className={`absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[150px] ${role === 'TENANT' ? 'bg-info/20' : 'bg-chart-2/20'} opacity-30 animate-pulse-slow`} />
                    <div className={`absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[150px] ${role === 'TENANT' ? 'bg-chart-5/10' : 'bg-warning/10'} opacity-30`} />

                    {/* 2. Large Symbolic Watermark */}
                    <Icon className={`absolute bottom-[-5%] -left-[5%] w-[800px] h-[800px] ${config.color} opacity-[0.03] stroke-[0.5px] -rotate-12 transition-all duration-1000`} />

                    {/* 3. Content Layer (Frames the Form) */}
                    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-16 z-10">

                        {/* Top Section: Title & Description */}
                        <motion.div
                            initial={{ x: -30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="flex flex-col items-start max-w-sm"
                        >

                            <h2 className="text-5xl font-black tracking-tight text-white mb-4 drop-shadow-lg">
                                {config.title}
                            </h2>
                            <p className="text-zinc-400 text-lg font-light leading-relaxed max-w-xs">
                                {config.description}
                            </p>
                        </motion.div>

                        {/* Bottom Section: Features List */}
                        <motion.div className="flex flex-col gap-4 items-end mt-auto">
                            {config.features.map((feature, idx) => {
                                const FeatureIcon = feature.icon;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 + idx * 0.1, duration: 0.5 }}
                                        className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/5 hover:bg-white/5 transition-colors shadow-lg group/feature"
                                    >
                                        <span className="font-medium text-base text-zinc-300 group-hover/feature:text-white transition-colors">
                                            {feature.text}
                                        </span>
                                        <div className={`p-2 rounded-xl bg-white/5 ${config.color}`}>
                                            <FeatureIcon className="w-5 h-5" />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Film Grain Texture */}
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.04] mix-blend-overlay pointer-events-none" />
        </div>
    );
}
