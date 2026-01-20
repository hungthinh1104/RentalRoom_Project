"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroSlideshow } from './hero-slideshow';
import { StatusBadge } from '@/components/ui/status-badge';
import { GlassCard } from '@/components/ui/glass-card';

export default function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden pt-[var(--header-safe-area)] pb-12 px-4">
      {/* Full Screen Background Slideshow */}
      <HeroSlideshow />

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="flex flex-col items-center text-center space-y-8 max-w-6xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ willChange: 'transform, opacity' }}
          >
            <StatusBadge
              variant="default"
              pulse
              className="bg-primary/20 text-primary border-primary/20 backdrop-blur-md"
            >
              Nền tảng thuê phòng #1 Việt Nam
            </StatusBadge>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ willChange: 'transform, opacity' }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground"
          >
            <span className="block lg:whitespace-nowrap">Tìm phòng trọ <span className="text-primary glow-text">ưng ý</span></span>
            <span className="block">chỉ trong tích tắc.</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ willChange: 'transform, opacity' }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed"
          >
            Kết nối với hơn 10,000+ chủ nhà uy tín. Trải nghiệm tìm kiếm thông minh, xem phòng 3D và ký hợp đồng trực tuyến an toàn.
          </motion.p>

          {/* Search Bar / CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ willChange: 'transform, opacity' }}
            className="w-full max-w-2xl relative z-20"
          >
            <div className="bg-background border border-border rounded-full p-2 shadow-xl flex flex-col md:flex-row items-center gap-2 transition-all duration-300 focus-within:ring-4 focus-within:ring-primary/20 focus-within:border-primary/50">
              <div className="flex-1 w-full relative flex items-center px-4 md:px-6 h-12 md:h-14">
                <MapPin className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Tìm theo khu vực, tên đường..."
                  aria-label="Tìm kiếm địa điểm"
                  className="w-full h-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base md:text-lg"
                />
              </div>
              <Button size="lg" className="w-full md:w-auto rounded-full h-12 md:h-14 px-8 text-base md:text-lg font-medium shadow-lg shadow-primary/20">
                <Search className="w-5 h-5 mr-2" />
                Tìm kiếm
              </Button>
            </div>

            {/* Popular Tags */}
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
              <span className="text-muted-foreground font-medium py-1">Phổ biến:</span>
              {['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'].map(tag => (
                <Link
                  key={tag}
                  href={`/rooms?q=${tag}`}
                  className="px-3 py-1 rounded-full bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Stats Bar (Floating) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="pt-12 w-full grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
          >
            {[
              { value: '10K+', label: 'Phòng trọ xác thực' },
              { value: '50K+', label: 'Người dùng hàng tháng' },
              { value: '98%', label: 'Tỷ lệ phản hồi' },
              { value: '24/7', label: 'Hỗ trợ khách hàng' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
