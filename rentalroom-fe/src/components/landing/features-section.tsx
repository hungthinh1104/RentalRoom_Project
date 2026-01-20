"use client";

import { motion } from 'framer-motion';
import {
  Search,
  Shield,
  Zap,
  MapPin,
  Clock,
  Heart
} from 'lucide-react';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';

const features = [
  {
    icon: <Search className="w-full h-full text-info" />,
    title: 'Tìm kiếm AI Thông minh',
    description: 'Công nghệ AI phân tích sở thích và thói quen để gợi ý những căn phòng phù hợp nhất với lối sống của bạn.',
    colSpan: 12,
    mdColSpan: 8,
    bgClass: "bg-info/5"
  },
  {
    icon: <Shield className="w-full h-full text-success" />,
    title: 'An toàn Tuyệt đối',
    description: '100% chủ nhà và phòng trọ được xác thực. Hợp đồng điện tử minh bạch, pháp lý rõ ràng.',
    colSpan: 12,
    mdColSpan: 4,
    bgClass: "bg-success/5"
  },
  {
    icon: <Zap className="w-full h-full text-warning" />,
    title: 'Đặt phòng Siêu tốc',
    description: 'Quy trình đặt phòng tự động chỉ trong 3 bước. Không chờ đợi, không thủ tục rườm rà.',
    colSpan: 12,
    mdColSpan: 4,
    bgClass: "bg-warning/5"
  },
  {
    icon: <MapPin className="w-full h-full text-warning" />,
    title: 'Bản đồ 3D Tương tác',
    description: 'Khám phá phòng trọ trực quan trên bản đồ. Xem tiện ích xung quanh: chợ, siêu thị, trường học...',
    colSpan: 12,
    mdColSpan: 8,
    bgClass: "bg-warning/5"
  },
  {
    icon: <Clock className="w-full h-full text-purple-500" />,
    title: 'Hỗ trợ 24/7',
    description: 'Đội ngũ CSKH chuyên nghiệp luôn sẵn sàng giải quyết mọi vấn đề phát sinh.',
    colSpan: 6,
    mdColSpan: 6,
    bgClass: "bg-purple-500/5"
  },
  {
    icon: <Heart className="w-full h-full text-destructive" />,
    title: 'Tiện ích Cá nhân hóa',
    description: 'Lưu yêu thích, so sánh giá, nhận thông báo khi có phòng mới phù hợp.',
    colSpan: 6,
    mdColSpan: 6,
    bgClass: "bg-destructive/5"
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 px-4 overflow-hidden bg-background text-foreground">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-background to-transparent opacity-80 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-md text-primary font-medium text-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            Công nghệ tiên phong
          </div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight text-foreground">
            Tại sao chọn{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-400">
              RentalRoom?
            </span>
          </h2>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto text-muted-foreground font-light leading-relaxed">
            Giải pháp tìm kiếm và quản lý phòng trọ toàn diện, được xây dựng trên nền tảng công nghệ 4.0.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <BentoGrid className="max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <BentoGridItem
              key={index}
              className={`flex flex-col justify-between p-8 rounded-3xl border border-border/50 bg-card/40 hover:bg-card/60 hover:border-primary/20 transition-all duration-300 backdrop-blur-sm group overflow-hidden ${feature.mdColSpan === 8 ? 'md:col-span-2' : feature.mdColSpan === 6 ? 'md:col-span-2' : 'md:col-span-1'}`}
            >
              <div className="mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/50 to-transparent p-3.5 shadow-sm border border-border/50 group-hover:scale-110 transition-transform duration-500 will-change-transform">
                {feature.icon}
              </div>
              <div className="space-y-3 relative z-10">
                <h3 className="text-2xl font-bold text-card-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
              {/* Hover Glow */}
              <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${feature.bgClass?.replace('/5', '/20')}`} />
            </BentoGridItem>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
