'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, Award, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface CityCardProps {
  name: string;
  rooms: string;
  icon?: React.ReactNode;
  searchQuery: string;
  region?: 'north' | 'central' | 'south';
}

const regionHighlights: Record<string, string> = {
  north: 'Giá ổn định, gần trường ĐH, nhiều lựa chọn khu trung tâm',
  central: 'Gần biển, nhiều căn mới, tiện đi lại và dịch vụ',
  south: 'Sầm uất, nhiều lựa chọn tiện nghi, kết nối khu công nghiệp',
};

export default function CityCard({ name, rooms, icon, searchQuery, region }: CityCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const highlight = region ? regionHighlights[region] : undefined;

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <Link href={`/properties?city=${searchQuery}`}>
        <Card
          className="cursor-pointer h-full backdrop-blur-xl border rounded-2xl p-4 shadow-xl transition-all duration-300"
          style={{
            backgroundColor: 'var(--color-popover)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-popover-foreground)'
          }}
        >
          <motion.div
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3"
          >
            <motion.div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-primary-light)'
              }}
              animate={{ rotate: isHovered ? 360 : 0 }}
              transition={{ duration: 0.6 }}
            >
              {icon || <MapPin className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />}
            </motion.div>
            <div className="space-y-1">
              <motion.div
                animate={{ color: isHovered ? 'var(--color-primary)' : 'var(--color-popover-foreground)' }}
                className="text-sm font-semibold"
                style={{ color: isHovered ? 'var(--color-primary)' : 'var(--color-popover-foreground)' }}
              >
                {name}
              </motion.div>
              <div className="text-xs text-slate-400">{rooms} phòng</div>
              {highlight && (
                <div className="text-xs text-muted-foreground leading-snug">{highlight}</div>
              )}
            </div>
          </motion.div>
        </Card>
      </Link>
    </motion.div>
  );
}
