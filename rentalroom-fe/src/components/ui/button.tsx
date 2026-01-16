import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 aria-invalid:ring-destructive/30 aria-invalid:border-destructive shadow-sm hover:shadow-md active:scale-[0.98] duration-200",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30",
        outline:
          "border border-input bg-background hover:bg-accent hover:border-primary/20 hover:text-accent-foreground dark:bg-input/20 dark:hover:bg-input/40",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent/60 hover:text-accent-foreground shadow-none hover:shadow-none border-transparent",
        link: "text-primary underline-offset-4 hover:underline shadow-none",
        premium: "bg-gradient-to-r from-primary to-[#FF5A7A] text-white hover:opacity-90 shadow-lg shadow-primary/30 border-0",
      },
      size: {
        default: "h-11 px-6 py-2.5 has-[>svg]:px-5",
        sm: "h-9 rounded-lg gap-1.5 px-4 text-xs has-[>svg]:px-3",
        lg: "h-14 rounded-xl px-8 text-base has-[>svg]:px-6 font-bold",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
