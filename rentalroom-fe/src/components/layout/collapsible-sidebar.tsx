'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';
import { Pin, PinOff, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { SidebarContent } from './sidebar'; // Import the unified content

interface CollapsibleSidebarProps {
    role?: string;
    className?: string;
}

export function CollapsibleSidebar({ role, className }: CollapsibleSidebarProps) {
    // Persist pinned state
    // Default to true (pinned) to match server consistency
    const [isPinned, setIsPinned] = useState(true);

    // Sync with localStorage on mount (client-side only behavior)
    // Sync with localStorage on mount (client-side only behavior)
    useEffect(() => {
        const pinned = localStorage.getItem('sidebar-pinned');
        if (pinned !== null) {
            setIsPinned(pinned === 'true');
        }
        // Delay hydration signal to ensure the initial state snap (duration: 0) takes effect
        // BEFORE we enable the spring animation. This prevents the "flash/bounce" on load.
        const timer = setTimeout(() => setIsHydrated(true), 200);
        return () => clearTimeout(timer);
    }, []);

    const [isHovered, setIsHovered] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    const handlePinToggle = () => {
        const newPinned = !isPinned;
        setIsPinned(newPinned);
        localStorage.setItem('sidebar-pinned', String(newPinned));
    };

    const isExpanded = isPinned || isHovered;

    return (
        <motion.aside
            layout
            initial={false}
            animate={{
                width: isExpanded ? 280 : 88,
            }}
            transition={isHydrated ? {
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8
            } : { duration: 0 }} // Prepare instant snap for hydration sync
            className={cn(
                'hidden lg:flex flex-col',
                'fixed left-4 top-24 bottom-4 z-40', // Floating Position
                'rounded-[2rem]', // Modern Shape
                'bg-background/60 backdrop-blur-md', // Glass Effect (Lighter blur for better blend)
                'border border-white/20 shadow-2xl shadow-black/5',
                'overflow-hidden',
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header / Pin Button */}
            <div className={cn("p-6 pb-2 flex items-center mb-2", isExpanded ? "justify-between" : "justify-center")}>
                {isExpanded && (
                    <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80 fade-in pl-2">
                        Menu
                    </span>
                )}
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePinToggle}
                                className={cn(
                                    "h-8 w-8 rounded-full hover:bg-muted/50 transition-all",
                                    !isExpanded && "hidden" // Hide pin button when collapsed, hover triggers expand first
                                )}
                            >
                                {isPinned ? (
                                    <Pin className="h-4 w-4 text-primary" />
                                ) : (
                                    <PinOff className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            {isPinned ? 'Bỏ ghim Sidebar' : 'Ghim Sidebar'}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Navigation Content */}
            <ScrollArea className="flex-1 px-3 -mr-3 pr-3"> {/* Negative margin hack for scrollbar */}
                <SidebarContent role={role} isCollapsed={!isExpanded} />
            </ScrollArea>

            {/* Decoration / Footer */}
            <div className="p-4 flex justify-center">
                <div className={cn("h-1 rounded-full bg-border transition-all duration-500", isExpanded ? "w-12" : "w-4")} />
            </div>

        </motion.aside>
    );
}
