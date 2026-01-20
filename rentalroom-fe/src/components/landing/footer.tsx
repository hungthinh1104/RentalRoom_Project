'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Heart
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

const footerLinks = {
  product: [
    { label: 'Tìm phòng trọ', href: '/properties' },
    { label: 'Đăng tin', href: '/landlords/properties/new' },
    { label: 'Bản đồ', href: '/map' },
    { label: 'Giá cả', href: '/pricing' }
  ],
  company: [
    { label: 'Về chúng tôi', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Tuyển dụng', href: '/careers' },
    { label: 'Liên hệ', href: '/contact' }
  ],
  support: [
    { label: 'Trung tâm hỗ trợ', href: '/support' },
    { label: 'Câu hỏi thường gặp', href: '/faq' },
    { label: 'Điều khoản dịch vụ', href: '/terms' },
    { label: 'Chính sách bảo mật', href: '/privacy' }
  ],
  social: [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' }
  ]
};

const contactInfo = [
  { icon: Mail, text: 'smartroom.mail@gmail.com', href: 'mailto:smartroom.mail@gmail.com' },
  { icon: Phone, text: '1900 xxxx', href: 'tel:1900xxxx' },
  { icon: MapPin, text: 'Hà Nội, Việt Nam', href: '#' }
];

const ANIMATION_VARIANTS = {
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border bg-muted/30 text-muted-foreground font-light">
      {/* Main Footer */}
      <div className="container mx-auto max-w-7xl px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={ANIMATION_VARIANTS.fadeInUp}
            className="lg:col-span-2 space-y-8"
          >
            {/* Logo */}
            <div>
              <BrandLogo href="/" size="lg" alwaysShowText />
            </div>

            <p className="text-base leading-relaxed max-w-sm text-muted-foreground">
              Nền tảng tìm kiếm và quản lý phòng trọ hàng đầu Việt Nam.
              Kết nối người thuê và chủ trọ một cách nhanh chóng, an toàn và hiệu quả.
            </p>

            {/* Contact Info */}
            <div className="space-y-4">
              {contactInfo.map((item) => (
                <a
                  key={item.text}
                  href={item.href}
                  className="flex items-center gap-3 text-sm transition-colors group hover:text-foreground"
                >
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors border border-border">
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                  </div>
                  <span>{item.text}</span>
                </a>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {footerLinks.social.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-background border border-border text-muted-foreground hover:bg-foreground hover:text-background transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links Columns */}
          {[
            { title: 'Sản phẩm', links: footerLinks.product },
            { title: 'Công ty', links: footerLinks.company },
            { title: 'Hỗ trợ', links: footerLinks.support }
          ].map((column, idx) => (
            <motion.div
              key={column.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={ANIMATION_VARIANTS.fadeInUp}
              transition={{ delay: 0.1 + idx * 0.1 }}
            >
              <h4 className="font-bold text-foreground mb-6 text-lg">{column.title}</h4>
              <ul className="space-y-4">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors inline-block hover:text-foreground hover:translate-x-1 duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border bg-muted/50">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-center md:text-left text-muted-foreground">
              © {currentYear} RentalRoom. All rights reserved.
            </p>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart className="w-4 h-4 fill-current text-rose-500 animate-pulse" />
              <span>in Vietnam</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
