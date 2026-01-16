'use client';

import { type ComponentType } from 'react';

interface IconProps {
    className?: string;
}

interface Stat {
    label: string;
    value: string | number;
    icon: ComponentType<IconProps>;
    color?: 'primary' | 'success' | 'warning' | 'info';
}

interface StatsGridProps {
    stats: Stat[];
}

export function StatsGrid({ stats }: StatsGridProps) {
    const getColorClasses = (color?: string) => {
        switch (color) {
            case 'success':
                return 'bg-success/10 text-success';
            case 'warning':
                return 'bg-warning/10 text-warning';
            case 'info':
                return 'bg-info/10 text-info';
            default:
                return 'bg-primary/10 text-primary';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                const colorClasses = getColorClasses(stat.color);

                return (
                    <div
                        key={index}
                        className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${colorClasses}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
