"use client"

import * as React from "react"
import { Slider as SliderBaseUI } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  onValueChange,
  ...props
}: {
  className?: string
  defaultValue?: number[]
  value?: number[]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number[]) => void
}) {
  const [localValue, setLocalValue] = React.useState<number[]>(
    value ?? defaultValue ?? [min]
  )

  React.useEffect(() => {
    if (value !== undefined) setLocalValue(value)
  }, [value])

  const values = localValue ?? [min]

  return (
    <SliderBaseUI.Root
      data-slot="slider"
      value={values[0]}
      onValueChange={(v: number) => {
        const newVal = [...values]
        newVal[0] = v
        setLocalValue(newVal)
        onValueChange?.(newVal)
      }}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SliderBaseUI.Track
        data-slot="slider-track"
        className="bg-muted relative h-1.5 w-full grow overflow-hidden rounded-full"
      >
        <SliderBaseUI.Indicator
          data-slot="slider-range"
          className="bg-primary absolute h-full"
        />
      </SliderBaseUI.Track>
      <SliderBaseUI.Thumb
        data-slot="slider-thumb"
        className="border-primary bg-background ring-ring/50 block size-4 rounded-full border shadow-sm transition-colors focus-visible:ring-4 focus-visible:outline-none disabled:pointer-events-none"
      />
    </SliderBaseUI.Root>
  )
}

export { Slider }
