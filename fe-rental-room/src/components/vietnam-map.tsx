'use client';

import React from 'react';
import vietnamMapPaths, { mapConfig } from './landing/vietnam-map-data';

export default function VietnamMap3D() {
  return (
    <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 800"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        <rect width="800" height="800" fill="url(#bgGradient)" />
        
        {/* Vietnam Map from SVG - All Paths */}
        <g opacity="0.95">
          {vietnamMapPaths.map((path, index) => (
            <path
              key={index}
              d={path.d}
              fill={mapConfig.fill}
              fillOpacity={mapConfig.fillOpacity}
              stroke={mapConfig.stroke}
              strokeWidth={mapConfig.strokeWidth}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
