'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import React from 'react';

export default function CTASection() {
  const [sparkles, setSparkles] = React.useState<Array<{ top: string; left: string; duration: number; delay: number }>>([]);

  React.useEffect(() => {
    setSparkles(
      [...Array(8)].map(() => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 2,
      }))
    );
  }, []);

  return (
    <section id="cta" className="relative py-24 px-4 overflow-hidden bg-background">
      {/* Seamless Transition Gradient */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-background to-transparent pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative rounded-[48px] overflow-hidden p-12 md:p-24 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] shadow-[0_20px_100px_-20px_rgba(255,56,92,0.4)]"
        >
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Grain */}
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay" />

            {/* Soft Glows */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-white/20 blur-[150px] rounded-full mix-blend-soft-light" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-black/20 blur-[150px] rounded-full mix-blend-soft-light" />

            {/* Animated Sparkles */}
            {sparkles.map((sparkle, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: sparkle.top,
                  left: sparkle.left,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5]
                }}
                transition={{
                  duration: sparkle.duration,
                  repeat: Infinity,
                  delay: sparkle.delay
                }}
              >
                <Sparkles className="w-4 h-4 text-white mix-blend-overlay" />
              </motion.div>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/20 backdrop-blur-md text-white border-white/30 text-base font-medium shadow-lg">
                <Sparkles className="w-4 h-4 fill-white" />
                Ưu đãi đặc biệt hôm nay
              </Badge>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight drop-shadow-xl"
            >
              Tìm nhà trọ không khó,
              <br />
              đã có <span className="text-white underline decoration-wavy decoration-white/30 underline-offset-8">RentalRoom</span> lo.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed"
            >
              Gia nhập cộng đồng 50,000+ người dùng và trải nghiệm phong cách sống mới ngay hôm nay.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-6 justify-center pt-8"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto gap-3 text-lg h-16 px-10 bg-white text-primary-600 hover:bg-white/95 font-bold shadow-2xl rounded-2xl"
                >
                  <Link href="/rooms">
                    <Sparkles className="w-5 h-5" />
                    Bắt đầu miễn phí
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto gap-3 text-lg h-16 px-10 bg-white/10 text-white border-white/40 hover:bg-white/20 font-semibold rounded-2xl backdrop-blur-md"
                >
                  <Link href="/contact">
                    Liên hệ đối tác
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
