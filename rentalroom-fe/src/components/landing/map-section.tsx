'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Dynamic import to avoid SSR issues with map
const VietnamMap3D = dynamic(
  () => import('./vietnam-map-3d'),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-full flex items-center justify-center rounded-3xl"
        style={{ backgroundColor: 'var(--color-muted)' }}
      >
        <p style={{ color: 'var(--color-muted-foreground)' }}>Đang tải bản đồ...</p>
      </div>
    )
  }
);

const cities = [
  { name: 'Hà Nội', rooms: 2500, region: 'Miền Bắc' },
  { name: 'Hồ Chí Minh', rooms: 4200, region: 'Miền Nam' },
  { name: 'Đà Nẵng', rooms: 1800, region: 'Miền Trung' }
];

const ANIMATION_VARIANTS = {
  fadeInUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  }
};

export default function MapSection() {
  const [showTip, setShowTip] = useState(false);
  const [tipPinned, setTipPinned] = useState(false);

  return (
    <section className="relative py-24 px-4 overflow-hidden bg-background text-foreground">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="text-center space-y-6 mb-16"
        >
          <motion.h2
            variants={ANIMATION_VARIANTS.fadeInUp}
            className="text-4xl md:text-5xl font-black tracking-tight"
          >
            Khách sạn & Phòng trọ{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              khắp Việt Nam
            </span>
          </motion.h2>
          <motion.p
            variants={ANIMATION_VARIANTS.fadeInUp}
            className="text-xl md:text-2xl max-w-2xl mx-auto text-muted-foreground font-light"
          >
            Tương tác với bản đồ 3D để khám phá không gian sống lý tưởng của bạn
          </motion.p>
        </motion.div>

        {/* Map and Cities Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Cities List */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="space-y-4 lg:order-1 order-2"
          >
            <h3 className="text-2xl font-bold mb-6 text-foreground">
              Thành phố nổi bật
            </h3>

            {cities.map((city) => (
              <motion.div
                key={city.name}
                variants={ANIMATION_VARIANTS.fadeInUp}
                whileHover={{ x: 8, scale: 1.02 }}
                className="group"
              >
                <Link href={`/properties?city=${encodeURIComponent(city.name)}`} className="block cursor-pointer">
                  <div className="p-6 rounded-2xl bg-card/60 border border-border/50 hover:bg-card/80 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                          <h4 className="text-xl font-bold text-card-foreground">
                            {city.name}
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {city.region} • <span className="text-foreground font-medium">{city.rooms.toLocaleString()}</span> phòng
                        </p>
                      </div>

                      <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            <motion.div
              variants={ANIMATION_VARIANTS.fadeInUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                asChild
                variant="outline"
                className="w-full mt-4 h-14 bg-transparent border-border text-foreground hover:bg-muted text-base"
              >
                <Link href="/properties" className="flex items-center gap-2">
                  Xem tất cả địa điểm
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Interactive Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 lg:order-2 order-1"
          >
            <div className="relative rounded-[32px] overflow-hidden p-0 border border-border/50 shadow-2xl bg-secondary min-h-[600px] lg:min-h-[800px]">
              {/* Map Container */}
              <div className="absolute inset-0">
                <VietnamMap3D isDark={false} />
              </div>

              {/* Tip Icon */}
              <div
                className="absolute top-6 right-6 z-20"
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => { if (!tipPinned) setShowTip(false); }}
              >
                <button
                  onClick={() => { setTipPinned(prev => !prev); setShowTip(prev => !prev); }}
                  className="p-3 rounded-full bg-background/80 backdrop-blur-md border border-border text-foreground hover:bg-background transition-all"
                  title="Hiển thị mẹo"
                >
                  <Info className="w-5 h-5" />
                </button>

                {/* Floating Info Card */}
                {showTip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-16 right-0 w-64 p-4 rounded-xl backdrop-blur-xl bg-popover/90 border border-border shadow-2xl"
                  >
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-popover-foreground block mb-1">Mẹo:</strong> Click vào các điểm trên bản đồ để xem phòng trọ tại thành phố đó.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
