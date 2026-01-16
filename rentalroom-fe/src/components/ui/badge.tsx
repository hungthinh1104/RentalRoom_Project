import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-primary/40 aria-invalid:ring-destructive/30 aria-invalid:border-destructive transition-all overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary [a&]:hover:bg-primary/20",
        secondary:
          "border-transparent bg-muted text-foreground [a&]:hover:bg-muted/80",
        destructive:
          "border-transparent bg-destructive/10 text-destructive [a&]:hover:bg-destructive/20 focus-visible:ring-destructive/30",
        outline:
          "border-primary/20 text-primary bg-primary/5 [a&]:hover:bg-primary/10 [a&]:hover:border-primary/30",
        success:
          "border-transparent bg-green-500/10 text-green-600 dark:text-green-400 [a&]:hover:bg-green-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
