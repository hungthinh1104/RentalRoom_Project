import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground/60 bg-muted/60 dark:bg-input/30 flex min-h-[120px] w-full rounded-xl border px-4 py-3 text-base shadow-sm transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-y",
        "focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:bg-background",
        "hover:border-input/80 hover:bg-muted/80",
        "aria-invalid:ring-destructive/30 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
