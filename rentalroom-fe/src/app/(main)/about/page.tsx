'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  Shield,
  Award,
  Target,
  Heart,
  TrendingUp,
  CheckCircle2,
  MapPin,
  Clock,
  Star,
  Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const stats = [
  { label: 'Tài sản được quản lý', value: '10,000+', icon: Building2 },
  { label: 'Giao dịch hàng tháng', value: '$2M+', icon: TrendingUp },
  { label: 'Chủ nhà doanh nghiệp', value: '5,000+', icon: Award },
  { label: 'Thời gian hoạt động', value: '99.9%', icon: Shield },
];

const features = [
  {
    icon: Shield,
    title: 'An toàn & Tin cậy',
    description: 'Mọi thông tin phòng trọ đều được xác minh kỹ lưỡng, đảm bảo chính xác và đáng tin cậy.',
  },
  {
    icon: Zap,
    title: 'Tìm kiếm nhanh chóng',
    description: 'Công nghệ AI giúp tìm phòng phù hợp chỉ trong vài giây với độ chính xác cao.',
  },
  {
    icon: MapPin,
    title: 'Bản đồ tương tác',
    description: 'Xem vị trí phòng trọ trực quan trên bản đồ 3D, dễ dàng chọn khu vực yêu thích.',
  },
  {
    icon: Clock,
    title: 'Hỗ trợ 24/7',
    description: 'Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn mọi lúc, mọi nơi.',
  },
  {
    icon: TrendingUp,
    title: 'Giá cả minh bạch',
    description: 'So sánh giá phòng dễ dàng, không phí ẩn, giao dịch rõ ràng.',
  },
  {
    icon: Heart,
    title: 'Trải nghiệm tốt nhất',
    description: 'Giao diện thân thiện, quy trình đơn giản, mang đến trải nghiệm thuê trọ hoàn hảo.',
  },
];

const values = [
  {
    title: 'Sứ mệnh',
    icon: Target,
    description: 'Trao quyền cho các chủ sở hữu tài sản và công ty quản lý bất động sản tại Việt Nam với công nghệ AI, giúp tiết kiệm 40% thời gian và tăng 30% doanh thu.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Tầm nhìn',
    icon: TrendingUp,
    description: 'Trở thành hệ điều hành (Operating System) số 1 cho quản lý tài sản cho thuê tại Việt Nam, phục vụ 100,000+ properties vào năm 2027.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Giá trị cốt lõi',
    icon: Heart,
    description: 'Uy tín, minh bạch, khách hàng là trung tâm. Chúng tôi cam kết mang đến dịch vụ tốt nhất.',
    color: 'from-orange-500 to-red-500',
  },
];

const timeline = [
  { year: '2023', title: 'Ra mắt', description: 'Nền tảng chính thức hoạt động với 1,000 phòng đầu tiên' },
  { year: '2024', title: 'Mở rộng', description: 'Phủ sóng 63 tỉnh thành, đạt 10,000+ phòng trọ' },
  { year: '2025', title: 'Đổi mới', description: 'Tích hợp AI và bản đồ 3D, nâng tầm trải nghiệm' },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background pt-6 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="mb-4" variant="secondary">
              Về chúng tôi
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Nền tảng cho thuê phòng trọ<br />thông minh hàng đầu
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Chúng tôi kết nối hàng nghìn người tìm phòng với các chủ nhà uy tín,
              mang đến trải nghiệm thuê trọ dễ dàng, an toàn và minh bạch.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <Card key={index} className="border-primary/20 bg-white/50 backdrop-blur">
                <CardContent className="pt-6 text-center">
                  <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tầm nhìn & Sứ mệnh
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Chúng tôi không chỉ cung cấp dịch vụ cho thuê phòng, mà còn xây dựng một cộng đồng tin cậy
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 overflow-hidden group">
                  <div className={`h-2 bg-gradient-to-r ${value.color}`} />
                  <CardContent className="pt-6 pb-8">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <value.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tại sao chọn chúng tôi?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Những tính năng vượt trội giúp bạn tìm phòng dễ dàng và an tâm hơn
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
                  <CardContent className="pt-6 pb-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Hành trình phát triển
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Từng bước tiến vững chắc để trở thành nền tảng cho thuê phòng hàng đầu
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="flex gap-6 mb-8 last:mb-0"
              >
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {item.year.slice(-2)}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-gradient-to-b from-primary/60 to-transparent mt-2" />
                  )}
                </div>
                <Card className="flex-1 mb-6">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono">{item.year}</Badge>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sẵn sàng tìm phòng lý tưởng?
            </h2>
            <p className="text-lg mb-8 text-primary-foreground/90">
              Hàng nghìn phòng trọ chất lượng đang chờ bạn khám phá
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.a
                href="/rooms"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <Building2 className="h-5 w-5" />
                Tìm phòng ngay
              </motion.a>
              <motion.a
                href="/contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur text-white border-2 border-white/30 px-8 py-3 rounded-lg font-semibold hover:bg-primary-foreground/20 transition-all"
              >
                Liên hệ với chúng tôi
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
