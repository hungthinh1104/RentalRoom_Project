'use client';

import React, { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import vietnamMapPaths, { mapConfig, cities } from './landing/vietnam-map-data';
import CityCard from './landing/city-card';

interface VietnamMap3DProps {
  isDark?: boolean;
}

export default function VietnamMap3D({ isDark = true }: VietnamMap3DProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const router = useRouter();
  const [svgSize, setSvgSize] = useState({ width: 800, height: 800 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Use CSS variables for backgrounds and grid colors to respect the global theme
  const bgStyle = useMemo(() => {
    return {
      bg: `linear-gradient(to bottom right, var(--color-page-gradient-from), var(--color-page-gradient-to))`,
      gridColor: 'var(--color-muted-foreground)',
      bgFill: 'var(--color-background)',
    };
  }, [isDark]);

  // Measure SVG size and respond to resizes without causing update loops
  useLayoutEffect(() => {
    if (!svgRef.current) return;
    const node = svgRef.current;
    const updateSize = () => {
      const r = node.getBoundingClientRect();
      const newSize = { width: Math.round(r.width), height: Math.round(r.height) };
      if (newSize.width !== svgSize.width || newSize.height !== svgSize.height) {
        setSvgSize(newSize);
      }
    };

    updateSize();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateSize());
      ro.observe(node);
    }
    window.addEventListener('resize', updateSize);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [svgRef.current]);

  return (
    <div 
      className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center group"
      style={{ background: 'transparent' }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 800 800"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={bgStyle.gridColor} strokeWidth="0.5" opacity="0.06" />
          </pattern>
        </defs>
        
        <rect width="800" height="800" fill="var(--color-card)" />
        <rect width="800" height="800" fill="url(#grid)" />
        
        <g>
          {vietnamMapPaths.map((path, index) => (
            <path
              key={index}
              d={path.d}
              fill={mapConfig.fill}
              fillOpacity={mapConfig.fillOpacity}
              stroke={mapConfig.stroke}
              strokeWidth={mapConfig.strokeWidth}
              // Use currentColor-like behavior via CSS variable
              style={{ transition: 'fill 200ms ease' }}
              className="cursor-pointer"
            />
          ))}
        </g>

        {/* City markers with interactive zones */}
        {cities.map((city) => (
          <g
            key={city.name}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/properties?city=${city.searchQuery}`); } }}
            onMouseEnter={() => setHoveredCity(city.name)}
            onMouseLeave={() => setHoveredCity(null)}
            onClick={() => router.push(`/properties?city=${city.searchQuery}`)}
            className="cursor-pointer"
            aria-label={`Tìm phòng tại ${city.name}`}
          >
            {/* Hover zone - larger invisible circle for easier interaction */}
            <circle
              cx={city.x}
              cy={city.y}
              r="15"
              fill="transparent"
              pointerEvents="all"
              className="group/city"
            />
            
            {/* Pulsing ring when hovered */}
            {hoveredCity === city.name && (
              <circle
                cx={city.x}
                cy={city.y}
                r="12"
                fill="none"
                stroke={mapConfig.fill}
                strokeWidth="1"
                opacity="0.6"
                className="animate-ping"
              />
            )}
            
            {/* Main marker circle */}
            <circle
              cx={city.x}
              cy={city.y}
              r="8"
              fill={hoveredCity === city.name ? mapConfig.hoverFill : mapConfig.fill}
              fillOpacity={hoveredCity === city.name ? 0.9 : 0.7}
              className="transition-all duration-200"
            />
            
            {/* Center dot */}
            <circle
              cx={city.x}
              cy={city.y}
              r="3"
              fill="white"
            />
          </g>
        ))}
      </svg>

      {/* City info tooltip - floats on map */}
      {hoveredCity && (
        <div className="absolute inset-0 pointer-events-none">
          {cities.map((city) => (
            hoveredCity === city.name && (
              <div
                key={city.name}
                style={{
                  position: 'absolute',
                  left: Math.max(0, Math.min(svgSize.width, (city.x / 800) * svgSize.width + 12)),
                  top: Math.max(0, Math.min(svgSize.height, (city.y / 800) * svgSize.height - 16)),
                  transform: 'translate(-50%, -100%)',
                  pointerEvents: 'auto',
                }}
              >
                <CityCard name={city.name} rooms={city.rooms} searchQuery={city.searchQuery} />
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
