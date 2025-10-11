import * as React from "react"
import { X, Check, ChevronDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { CommandInput } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type Option = {
  value: string
  label: string
  disable?: boolean
  fixed?: boolean
  [key: string]: string | boolean | undefined
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onSelectedChange: (selected: string[]) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function MultiSelect({
  options,
  selected,
  onSelectedChange,
  className,
  placeholder,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (item: string) => {
    onSelectedChange(selected.filter((i) => i !== item))
  }

  // Memoize selected options to prevent re-renders
  const selectedOptions = React.useMemo(() => {
    return selected
      .map((item) => options.find((o) => o.value === item))
      .filter(Boolean) as Option[]
  }, [selected, options])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          disabled={disabled}
        >
          {selected.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1">
              {selectedOptions.map((option, index) => (
                <Badge
                  key={option?.value || index}
                  className="flex items-center gap-1"
                  variant="secondary"
                >
                  {option?.label || selected[index]}
                  <Button
                    className="h-auto p-0"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnselect(selected[index])
                    }}
                    disabled={option?.fixed}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Rechercher..." />
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => {
                  onSelectedChange(
                    selected.includes(option.value)
                      ? selected.filter((item) => item !== option.value)
                      : [...selected, option.value]
                  )
                  setOpen(true)
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selected.includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}