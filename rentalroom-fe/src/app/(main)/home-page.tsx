'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building2,
  Zap,
  Shield,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Users,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const stats = [
  { label: 'Properties Managed', value: '10,000+', icon: Building2 },
  { label: 'Active Landlords', value: '5,000+', icon: Users },
  { label: 'Monthly Transactions', value: '$2M+', icon: DollarSign },
  { label: 'Uptime SLA', value: '99.9%', icon: Shield },
];

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Search',
    description: 'Semantic search in Vietnamese using Google Gemini. Find properties with natural language queries.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 Type II certified (in progress). Bank-level encryption for all data.',
  },
  {
    icon: TrendingUp,
    title: 'Automated Billing',
    description: 'Save 40% admin time with auto-generated invoices and Sepay integration.',
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Trust Badge */}
            <Badge className="mb-6" variant="secondary">
              <Shield className="h-3 w-3 mr-1" />
              99.9% Uptime SLA
            </Badge>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-tight">
              Quản lý tài sản cho thuê
              <br />
              <span className="text-foreground">thông minh với AI</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
              Tiết kiệm <strong className="text-primary">40% thời gian quản lý</strong>,
              tăng <strong className="text-primary">30% doanh thu</strong> cho chủ chuỗi căn hộ tại Việt Nam
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" asChild className="text-base shadow-lg shadow-primary/20">
                <Link href="/register">
                  <CheckCircle2 className="h-5 w-5" />
                  Dùng thử miễn phí 14 ngày
                </Link>
              </Button>

              <Button size="lg" variant="outline" asChild>
                <Link href="/enterprise">
                  Giải pháp Enterprise
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <p className="text-sm text-muted-foreground">
              Được tin dùng bởi <strong>5,000+ chủ nhà</strong> tại 63 tỉnh thành Việt Nam
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-5xl mx-auto"
          >
            {stats.map((stat, index) => (
              <Card key={index} className="border-primary/20 bg-white/50 backdrop-blur hover:shadow-lg transition-all">
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

      {/* Features Section */}
      <section className="py-20 bg-background">
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
              Tại sao chọn Hestia?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Nền tảng duy nhất được xây dựng riêng cho thị trường Việt Nam
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
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
              Sẵn sàng chuyển đổi số?
            </h2>
            <p className="text-lg mb-8 text-primary-foreground/90">
              Tham gia cùng 5,000+ chủ nhà đang sử dụng Hestia hàng ngày
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="shadow-lg">
                <Link href="/register">
                  <Building2 className="h-5 w-5" />
                  Bắt đầu miễn phí
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="bg-primary-foreground/10 backdrop-blur text-white border-2 border-white/30 hover:bg-primary-foreground/20"
              >
                <Link href="/contact">
                  Liên hệ tư vấn
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
