'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Nguyễn Văn A',
    role: 'Sinh viên',
    location: 'Hà Nội',
    avatar: '/avatars/avatar-1.jpg',
    rating: 5,
    content: 'Tìm được phòng trọ ưng ý chỉ sau 2 ngày tìm kiếm. Giao diện đẹp, dễ sử dụng và hỗ trợ nhiệt tình!'
  },
  {
    name: 'Trần Thị B',
    role: 'Nhân viên văn phòng',
    location: 'TP. Hồ Chí Minh',
    avatar: '/avatars/avatar-2.jpg',
    rating: 5,
    content: 'Nền tảng tuyệt vời! AI gợi ý phòng trọ rất chính xác với nhu cầu của tôi. Đặt phòng nhanh chóng và an toàn.'
  },
  {
    name: 'Lê Văn C',
    role: 'Freelancer',
    location: 'Đà Nẵng',
    avatar: '/avatars/avatar-3.jpg',
    rating: 5,
    content: 'Bản đồ tương tác giúp tôi dễ dàng tìm phòng gần nơi làm việc. Chủ trọ uy tín, hợp đồng rõ ràng.'
  }
];

const ANIMATION_VARIANTS = {
  fadeInUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  }
};

export default function TestimonialsSection() {
  return (
    <section className="relative py-24 px-4 overflow-hidden bg-background text-foreground">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="text-center space-y-6 mb-20"
        >
          <motion.h2
            variants={ANIMATION_VARIANTS.fadeInUp}
            className="text-4xl md:text-5xl font-black tracking-tight"
          >
            Khách hàng nói gì về{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-400">
              chúng tôi
            </span>
          </motion.h2>
          <motion.p
            variants={ANIMATION_VARIANTS.fadeInUp}
            className="text-xl md:text-2xl max-w-2xl mx-auto text-muted-foreground font-light"
          >
            Hàng nghìn người dùng đã tìm được ngôi nhà lý tưởng với chúng tôi
          </motion.p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.15 } }
          }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={ANIMATION_VARIANTS.fadeInUp}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className="group relative p-8 rounded-[32px] bg-card/60 backdrop-blur-md border border-border/50 shadow-sm hover:bg-card/80 transition-all duration-300">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
                  <Quote className="w-16 h-16" />
                </div>

                {/* Content */}
                <div className="relative space-y-8">
                  {/* Rating */}
                  <div className="flex gap-1.5">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-current text-warning"
                      />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-lg leading-relaxed text-card-foreground font-light">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4 pt-6 border-t border-border/40">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-primary to-rose-500 text-white">
                        {testimonial.name.charAt(0)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate text-foreground">
                        {testimonial.name}
                      </div>
                      <div className="text-sm truncate text-muted-foreground">
                        {testimonial.role} • {testimonial.location}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={ANIMATION_VARIANTS.fadeInUp}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm hover:bg-secondary/70 transition-colors">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-background bg-secondary text-secondary-foreground font-bold"
                >
                  <span className="text-xs">
                    {String.fromCharCode(65 + i)}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-base font-medium text-muted-foreground pl-2">
              Tham gia cùng <strong className="text-foreground">10,000+</strong> người dùng hài lòng
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
