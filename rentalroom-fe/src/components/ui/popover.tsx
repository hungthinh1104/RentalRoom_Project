"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

// Provide a stable id for popover pairing to avoid hydration mismatches
const PopoverIdContext = React.createContext<string | null>(null)

function Popover({ id, children, ...props }: React.ComponentProps<typeof PopoverPrimitive.Root> & { id?: string }) {
  const generatedId = React.useId()
  const [stableId] = React.useState(() => id ?? generatedId)

  return (
    <PopoverPrimitive.Root data-slot="popover" {...props}>
      <PopoverIdContext.Provider value={stableId}>{children}</PopoverIdContext.Provider>
    </PopoverPrimitive.Root>
  )
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  const id = React.useContext(PopoverIdContext)
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" aria-controls={id ?? undefined} {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const id = React.useContext(PopoverIdContext)

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        id={id ?? undefined}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
