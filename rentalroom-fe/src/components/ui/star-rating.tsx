import { Star } from "lucide-react";
import { memo } from "react";

interface StarRatingProps {
    rating: number;
    size?: "sm" | "md" | "lg";
}

const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
};

export const StarRating = memo(function StarRating({ rating, size = "sm" }: StarRatingProps) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => {
                const isFilled = i < fullStars;
                const isHalf = i === fullStars && hasHalfStar;

                return (
                    <Star
                        key={i}
                        className={`${sizeClasses[size]} ${isFilled
                            ? "fill-[var(--warning)] text-[var(--warning)]"
                            : isHalf
                                ? "fill-[var(--warning)]/50 text-[var(--warning)]"
                                : "text-muted-foreground/30"
                            }`}
                    />
                );
            })}
        </div>
    );
});
