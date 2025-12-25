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
  const [isDark, setIsDark] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [tipPinned, setTipPinned] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-12 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, var(--color-background) 100%)'
          }}
        />
      </div>

      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: {
              transition: { staggerChildren: 0.1 }
            }
          }}
          className="text-center space-y-4 mb-16"
        >
          <motion.h2 
            variants={ANIMATION_VARIANTS.fadeInUp}
            className="text-4xl md:text-5xl font-bold"
            style={{ color: 'var(--color-foreground)' }}
          >
            Khám phá phòng trọ{' '}
            <span 
              className="bg-clip-text text-transparent"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text'
              }}
            >
              trên bản đồ
            </span>
          </motion.h2>
          <motion.p 
            variants={ANIMATION_VARIANTS.fadeInUp}
            className="text-lg md:text-xl max-w-2xl mx-auto"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            Tương tác với bản đồ 3D để tìm phòng trọ tại thành phố bạn mong muốn
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
              visible: {
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="space-y-4 lg:order-1 order-2"
          >
            <h3 
              className="text-2xl font-semibold mb-6"
              style={{ color: 'var(--color-foreground)' }}
            >
              Thành phố nổi bật
            </h3>
            
            {cities.map((city) => (
              <motion.div
                key={city.name}
                variants={ANIMATION_VARIANTS.fadeInUp}
                whileHover={{ x: 8, scale: 1.02 }}
                className="group"
              >
                <Link href={`/properties?city=${encodeURIComponent(city.name)}`}>
                  <div 
                    className="p-6 rounded-2xl transition-all duration-300 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin 
                            className="w-5 h-5 group-hover:scale-110 transition-transform" 
                            style={{ color: 'var(--color-primary)' }}
                          />
                          <h4 
                            className="text-xl font-semibold"
                            style={{ color: 'var(--color-foreground)' }}
                          >
                            {city.name}
                          </h4>
                        </div>
                        <p 
                          className="text-sm"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          {city.region} • {city.rooms.toLocaleString()} phòng
                        </p>
                      </div>
                      
                      <ArrowRight 
                        className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" 
                        style={{ color: 'var(--color-primary)' }}
                      />
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
                className="w-full mt-4 h-12"
                style={{
                  borderColor: 'var(--color-primary)',
                  color: 'var(--color-primary)'
                }}
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
            <div 
              className="relative rounded-3xl overflow-hidden p-8"
              style={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                minHeight: '800px'
              }}
            >
              {/* Map Container */}
              <div className="absolute inset-0">
                <VietnamMap3D isDark={isDark} />
              </div>

              {/* Tip Icon + Floating Card wrapper */}
              <div
                className="absolute top-6 right-6 z-20"
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => { if (!tipPinned) setShowTip(false); }}
              >
                <button
                  onClick={() => { setTipPinned(prev => !prev); setShowTip(prev => !prev); }}
                  className="p-2 rounded-full transition-all duration-200 hover:scale-110"
                  style={{
                    backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                    border: '1px solid var(--color-primary)',
                  }}
                  title="Hiển thị mẹo"
                >
                  <Info 
                    className="w-5 h-5"
                    style={{ color: 'var(--color-primary)' }}
                  />
                </button>

                {/* Floating Info Card */}
                {showTip && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-16 right-6 z-20 max-w-sm p-4 rounded-2xl backdrop-blur-xl"
                  style={{
                    backgroundColor: 'rgba(var(--color-card-rgb), 0.9)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    <strong style={{ color: 'var(--color-foreground)' }}>Mẹo:</strong> Click vào các điểm trên bản đồ để xem phòng trọ tại thành phố đó
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
