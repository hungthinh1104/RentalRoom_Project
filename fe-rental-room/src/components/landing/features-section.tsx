'use client';

import { motion } from 'framer-motion';
import { 
  Search, 
  Shield, 
  Zap, 
  MapPin, 
  Clock, 
  Heart,
  Star,
  TrendingUp 
} from 'lucide-react';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: Search,
    title: 'Tìm kiếm thông minh',
    description: 'AI tự động gợi ý phòng trọ phù hợp với nhu cầu và ngân sách của bạn',
  },
  {
    icon: Shield,
    title: 'An toàn & Bảo mật',
    description: 'Xác thực chủ trọ, hợp đồng điện tử, thanh toán bảo mật 100%',
  },
  {
    icon: Zap,
    title: 'Đặt phòng nhanh',
    description: 'Chỉ 3 bước đơn giản để hoàn tất đặt phòng trong vài phút',
  },
  {
    icon: MapPin,
    title: 'Bản đồ tương tác',
    description: 'Khám phá phòng trọ trực quan với bản đồ 3D toàn quốc',
  },
  {
    icon: Clock,
    title: 'Hỗ trợ 24/7',
    description: 'Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ mọi lúc',
  },
  {
    icon: Heart,
    title: 'Yêu thích & So sánh',
    description: 'Lưu phòng yêu thích, so sánh chi tiết để chọn lựa tốt nhất',
  }
];

const stats = [
  {
    icon: Star,
    value: '4.9/5',
    label: 'Đánh giá trung bình',
  },
  {
    icon: MapPin,
    value: '63',
    label: 'Tỉnh thành',
  },
  {
    icon: TrendingUp,
    value: '95%',
    label: 'Tỷ lệ đặt phòng',
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-12 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      </div>

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
              chúng tôi?
            </span>
          </h2>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground">
            Nền tảng tìm kiếm phòng trọ hiện đại nhất Việt Nam với công nghệ AI và trải nghiệm người dùng tốt nhất
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="group relative p-8 rounded-[28px] bg-card/80 backdrop-blur-xl border border-border hover:shadow-xl hover:shadow-muted/30 transition-all duration-300">
                  {/* Hover Gradient */}
                  <div className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/5 to-transparent" />

                  <div className="relative space-y-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 bg-primary/10">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>

                    <h3 className="text-xl font-semibold text-foreground">
                      {feature.title}
                    </h3>

                    <p className="leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="p-8 md:p-12 rounded-[28px] bg-card/80 backdrop-blur-xl border border-border shadow-xl shadow-muted/30">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center space-y-3"
                >
                  <div className="flex justify-center">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <stat.icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
