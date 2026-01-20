import Link from "next/link";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BrandLogoProps {
  /** Target URL (default: "/") */
  href?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show text next to icon */
  showText?: boolean;
  /** Show subtitle under brand name */
  subtitle?: string;
  /** Additional CSS classes */
  className?: string;
  /** always show text (ignore responsive hiding) */
  alwaysShowText?: boolean;
  /** Color variant */
  variant?: "default" | "white";
}

const sizeConfig = {
  sm: {
    icon: "w-7 h-7",
    iconInner: "w-4 h-4",
    text: "text-base",
    subtitle: "text-[10px]",
  },
  md: {
    icon: "w-8 h-8",
    iconInner: "w-5 h-5",
    text: "text-lg",
    subtitle: "text-xs",
  },
  lg: {
    icon: "w-10 h-10",
    iconInner: "w-6 h-6",
    text: "text-xl",
    subtitle: "text-xs",
  },
};

export function BrandLogo({
  href = "/",
  size = "md",
  showText = true,
  subtitle,
  className,
  alwaysShowText = false,
  variant = "default",
}: BrandLogoProps) {
  const config = sizeConfig[size];

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 flex-shrink-0 group relative",
        className
      )}
    >
      <motion.div
        className="flex items-center gap-2"
        whileHover="hover"
        initial="rest"
        animate="rest"
      >
        {/* Icon Container */}
        <motion.div
          variants={{
            rest: { scale: 1, rotate: 0 },
            hover: { scale: 1.1, rotate: -3 },
          }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className={cn(
            config.icon,
            "rounded-lg flex items-center justify-center shadow-md",
            variant === "default"
              ? "bg-gradient-to-br from-rose-600 to-pink-500 text-white"
              : "bg-white/10 backdrop-blur-md border border-white/20 text-white"
          )}
        >
          <Building2 className={config.iconInner} />
        </motion.div>

        {/* Text Container */}
        {showText && (
          <div className="flex flex-col leading-tight">
            <span
              className={cn(
                config.text,
                "font-bold",
                variant === "default"
                  ? "bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent"
                  : "text-white",
                !alwaysShowText && "hidden sm:inline-block"
              )}
            >
              RentalRoom
            </span>
            {subtitle && (
              <span
                className={cn(
                  config.subtitle,
                  "text-muted-foreground",
                  !alwaysShowText && "hidden sm:inline-block"
                )}
              >
                {subtitle}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </Link>
  );
}

export default BrandLogo;

