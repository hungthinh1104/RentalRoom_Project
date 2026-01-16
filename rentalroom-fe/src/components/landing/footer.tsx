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
    <footer className="relative border-t" style={{ borderColor: 'var(--color-border)' }}>
      {/* Main Footer */}
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={ANIMATION_VARIANTS.fadeInUp}
            className="lg:col-span-2 space-y-6"
          >
            <BrandLogo href="/" size="lg" alwaysShowText />

            <p
              className="text-sm leading-relaxed max-w-sm"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Nền tảng tìm kiếm và quản lý phòng trọ hàng đầu Việt Nam.
              Kết nối người thuê và chủ trọ một cách nhanh chóng, an toàn và hiệu quả.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              {contactInfo.map((item) => (
                <a
                  key={item.text}
                  href={item.href}
                  className="flex items-center gap-3 text-sm transition-colors group"
                  style={{ color: 'var(--color-muted-foreground)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-muted-foreground)';
                  }}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
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
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: 'var(--color-muted)',
                    color: 'var(--color-muted-foreground)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-muted)';
                    e.currentTarget.style.color = 'var(--color-muted-foreground)';
                  }}
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Product Links */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={ANIMATION_VARIANTS.fadeInUp}
            transition={{ delay: 0.1 }}
          >
            <h4
              className="font-semibold mb-4"
              style={{ color: 'var(--color-foreground)' }}
            >
              Sản phẩm
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors inline-block"
                    style={{ color: 'var(--color-muted-foreground)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-muted-foreground)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={ANIMATION_VARIANTS.fadeInUp}
            transition={{ delay: 0.2 }}
          >
            <h4
              className="font-semibold mb-4"
              style={{ color: 'var(--color-foreground)' }}
            >
              Công ty
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors inline-block"
                    style={{ color: 'var(--color-muted-foreground)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-muted-foreground)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support Links */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={ANIMATION_VARIANTS.fadeInUp}
            transition={{ delay: 0.3 }}
          >
            <h4
              className="font-semibold mb-4"
              style={{ color: 'var(--color-foreground)' }}
            >
              Hỗ trợ
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors inline-block"
                    style={{ color: 'var(--color-muted-foreground)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-muted-foreground)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        className="border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p
              className="text-sm text-center md:text-left"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              © {currentYear} RentalRoom. All rights reserved.
            </p>

            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--color-muted-foreground)' }}>
                Made with
              </span>
              <Heart
                className="w-4 h-4 fill-current animate-pulse"
                style={{ color: 'var(--color-primary)' }}
              />
              <span style={{ color: 'var(--color-muted-foreground)' }}>
                in Vietnam
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
