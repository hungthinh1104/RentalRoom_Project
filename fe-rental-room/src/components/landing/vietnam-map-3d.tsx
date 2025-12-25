'use client';

import React, { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import vietnamMapPaths, { mapConfig, cities } from './vietnam-map-data';
import CityCard from './city-card';

interface VietnamMap3DProps {
  isDark?: boolean;
}

export default function VietnamMap3D({ isDark = true }: VietnamMap3DProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [svgSize, setSvgSize] = useState({ width: 900, height: 900 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const router = useRouter();

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
      const nextSize = { width: Math.round(r.width), height: Math.round(r.height) };
      setSvgSize((prev) => (prev.width !== nextSize.width || prev.height !== nextSize.height ? nextSize : prev));
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
  }, []);

  const mapWidth = 900;
  const mapHeight = 1000;

  const getCityPosition = (city: { x: number; y: number }) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { left: 0, top: 0 };
    const left = rect.left + (city.x / mapWidth) * rect.width;
    const top = rect.top + (city.y / mapHeight) * rect.height;
    const clampedLeft = Math.max(8, Math.min((typeof window !== 'undefined' ? window.innerWidth : rect.width) - 8, left));
    const clampedTop = Math.max(8, Math.min((typeof window !== 'undefined' ? window.innerHeight : rect.height) - 8, top));
    return { left: clampedLeft, top: clampedTop };
  };

  return (
    <div 
      className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center group"
      style={{ background: 'transparent' }}
    >
      <svg
        ref={svgRef}
        viewBox="0 -100 900 1000"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={bgStyle.gridColor} strokeWidth="0.5" opacity="0.06" />
          </pattern>
        </defs>
        
        <rect width="900" height="1000" fill="var(--color-card)" />
        <rect width="900" height="1000" fill="url(#grid)" />
        
        <g>
          {vietnamMapPaths.map((path, index) => {
            const isHovered = path.id && hoveredProvince === path.id;
            return (
              <path
                key={index}
                d={path.d}
                fill={isHovered ? mapConfig.hoverFill : mapConfig.fill}
                fillOpacity={isHovered ? mapConfig.hoverOpacity : mapConfig.fillOpacity}
                stroke={mapConfig.stroke}
                strokeWidth={mapConfig.strokeWidth}
                onMouseEnter={() => path.id && setHoveredProvince(path.id)}
                onMouseLeave={() => setHoveredProvince(null)}
                style={{ 
                  transition: 'fill-opacity 200ms ease',
                  cursor: path.id ? 'pointer' : 'default'
                }}
              />
            );
          })}
        </g>

        {/* City markers with interactive zones */}
        {cities.map((city) => (
          <g
            key={city.name}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push(`/properties?city=${city.searchQuery}`);
              }
            }}
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
            
            {/* Subtle hover ring */}
            {hoveredCity === city.name && (
              <circle
                cx={city.x}
                cy={city.y}
                r="10"
                fill="none"
                stroke={mapConfig.fill}
                strokeWidth="1"
                opacity="0.35"
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
      {/* Hover card showing city highlights */}
      {hoveredCity && (
        <div className="fixed pointer-events-none z-50">
          {cities.map((city) => (
            hoveredCity === city.name && (
              <div
                key={city.name}
                style={{
                  position: 'fixed',
                  ...(() => {
                    const { left, top } = getCityPosition(city);
                    return { left: left + 4, top: top - 4 };
                  })(),
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div className="pointer-events-none">
                  <CityCard
                    name={city.name}
                    rooms={city.rooms}
                    searchQuery={city.searchQuery}
                    region={city.region as 'north' | 'central' | 'south'}
                  />
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Province name tooltip */}
      {hoveredProvince && (
        <div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg pointer-events-none z-10"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-foreground)',
          }}
        >
          <p className="text-sm font-medium">{hoveredProvince}</p>
        </div>
      )}
    </div>
  );
}
