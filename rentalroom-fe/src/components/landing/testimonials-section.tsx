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
    <section className="relative py-12 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
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
            className="text-4xl md:text-5xl font-bold text-foreground"
          >
            Khách hàng nói gì về{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              chúng tôi
            </span>
          </motion.h2>
          <motion.p 
            variants={ANIMATION_VARIANTS.fadeInUp}
            className="text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground"
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
            visible: {
              transition: { staggerChildren: 0.15 }
            }
          }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={ANIMATION_VARIANTS.fadeInUp}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className="group relative p-8 rounded-[28px] bg-card/80 backdrop-blur-xl border border-border hover:shadow-xl hover:shadow-muted/30 transition-all duration-300">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
                  <Quote className="w-16 h-16" />
                </div>

                {/* Content */}
                <div className="relative space-y-6">
                  {/* Rating */}
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-current text-primary"
                      />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-base leading-relaxed text-foreground">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4 pt-4 border-t border-border">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                      {/* Fallback avatar with initials */}
                      <div className="w-full h-full flex items-center justify-center text-lg font-semibold bg-primary/10 text-primary">
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
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-muted border border-border">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-background bg-primary/10 text-primary"
                >
                  <span className="text-xs font-semibold">
                    {String.fromCharCode(65 + i)}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">
              Tham gia cùng <strong className="text-primary">10,000+</strong> người dùng hài lòng
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
