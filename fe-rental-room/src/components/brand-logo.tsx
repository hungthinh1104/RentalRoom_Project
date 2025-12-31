import Link from "next/link";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  /** Always show text (ignore responsive hiding) */
  alwaysShowText?: boolean;
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
}: BrandLogoProps) {
  const config = sizeConfig[size];

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 flex-shrink-0 group transition-transform hover:scale-[1.02]",
        className
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          config.icon,
          "rounded-lg bg-gradient-to-br from-rose-600 to-pink-500 flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow"
        )}
      >
        <Building2 className={config.iconInner} />
      </div>

      {/* Text Container */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={cn(
              config.text,
              "font-bold bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent",
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
    </Link>
  );
}

export default BrandLogo;

