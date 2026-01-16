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
    icon: <Search className="w-full h-full text-primary" />,
    title: 'Tìm kiếm AI Thông minh',
    description: 'Công nghệ AI phân tích sở thích và thói quen để gợi ý những căn phòng phù hợp nhất với lối sống của bạn.',
    colSpan: 12,
    mdColSpan: 8,
    bgClass: "bg-blue-500/5"
  },
  {
    icon: <Shield className="w-full h-full text-green-500" />,
    title: 'An toàn Tuyệt đối',
    description: '100% chủ nhà và phòng trọ được xác thực. Hợp đồng điện tử minh bạch, pháp lý rõ ràng.',
    colSpan: 12,
    mdColSpan: 4,
    bgClass: "bg-green-500/5"
  },
  {
    icon: <Zap className="w-full h-full text-yellow-500" />,
    title: 'Đặt phòng Siêu tốc',
    description: 'Quy trình đặt phòng tự động chỉ trong 3 bước. Không chờ đợi, không thủ tục rườm rà.',
    colSpan: 12,
    mdColSpan: 4,
    bgClass: "bg-yellow-500/5"
  },
  {
    icon: <MapPin className="w-full h-full text-orange-500" />,
    title: 'Bản đồ 3D Tương tác',
    description: 'Khám phá phòng trọ trực quan trên bản đồ. Xem tiện ích xung quanh: chợ, siêu thị, trường học...',
    colSpan: 12,
    mdColSpan: 8,
    bgClass: "bg-orange-500/5"
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
    icon: <Heart className="w-full h-full text-red-500" />,
    title: 'Tiện ích Cá nhân hóa',
    description: 'Lưu yêu thích, so sánh giá, nhận thông báo khi có phòng mới phù hợp.',
    colSpan: 6,
    mdColSpan: 6,
    bgClass: "bg-red-500/5"
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 px-4 overflow-hidden bg-background">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Tại sao chọn{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              RentalRoom?
            </span>
          </h2>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground">
            Giải pháp tìm kiếm và quản lý phòng trọ toàn diện, hiện đại và tin cậy nhất.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <BentoGrid>
          {features.map((feature, index) => (
            <BentoGridItem
              key={index}
              className={`flex flex-col justify-between group overflow-hidden ${feature.bgClass ?? ''} ${feature.mdColSpan === 8 ? 'md:col-span-2' :
                  feature.mdColSpan === 6 ? 'md:col-span-2' :
                    'md:col-span-1'
                }`}
            >
              <div className="mb-4 w-12 h-12 rounded-xl bg-background/50 p-2.5 shadow-sm border border-border/50 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </BentoGridItem>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
