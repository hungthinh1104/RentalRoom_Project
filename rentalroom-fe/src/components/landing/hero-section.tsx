"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroSlideshow } from './hero-slideshow';
import { StatusBadge } from '@/components/ui/status-badge';
import { GlassCard } from '@/components/ui/glass-card';

export default function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden pt-20 pb-12 px-4">
      {/* Full Screen Background Slideshow */}
      <HeroSlideshow />

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
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
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground"
          >
            Tìm phòng trọ{' '}
            <span className="text-primary glow-text">
              ưng ý
            </span>
            <br />
            chỉ trong tích tắc.
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed"
          >
            Kết nối với hơn 10,000+ chủ nhà uy tín. Trải nghiệm tìm kiếm thông minh, xem phòng 3D và ký hợp đồng trực tuyến an toàn.
          </motion.p>

          {/* Search Bar / CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-2xl"
          >
            <GlassCard className="p-2 md:p-3 !rounded-full flex flex-col md:flex-row gap-2 items-center backdrop-blur-xl bg-background/40 hover:bg-background/50 transition-colors">
              <div className="flex-1 w-full relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm theo khu vực, tên đường..."
                  className="w-full h-12 md:h-14 pl-12 pr-4 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/70 text-lg"
                />
              </div>
              <Button size="lg" className="w-full md:w-auto h-12 md:h-14 px-8 rounded-full text-lg shadow-lg shadow-primary/25">
                <Search className="w-5 h-5 mr-2" />
                Tìm kiếm
              </Button>
            </GlassCard>

            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm font-medium text-muted-foreground">
              <span>Phổ biến:</span>
              {['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ'].map(city => (
                <Link key={city} href={`/rooms?city=${city}`} className="hover:text-primary transition-colors underline decoration-dotted decoration-primary/50">
                  {city}
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
