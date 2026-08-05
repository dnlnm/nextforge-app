"use client"

import * as React from "react"
import { format } from "date-fns"

import { Button } from "@repo/design-system/components/ui/button"
import { Calendar } from "@repo/design-system/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover"
import { cn } from "@repo/design-system/lib/utils"
import { CalendarIcon } from "lucide-react"

function DatePicker({
  className,
  defaultValue,
  id,
  name,
  placeholder = "Select date",
}: {
  className?: string
  defaultValue?: string
  id?: string
  name: string
  placeholder?: string
}) {
  const [date, setDate] = React.useState<Date | undefined>(
    defaultValue ? new Date(`${defaultValue}T00:00:00.000Z`) : undefined
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "justify-start font-normal text-left w-full",
            !date && "text-muted-foreground",
            className
          )}
          id={id}
          variant="outline"
        >
          <CalendarIcon className="size-4" />
          <span className="min-w-0 truncate">
            {date ? format(date, "dd/MM/yy") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          captionLayout="dropdown"
          mode="single"
          onSelect={setDate}
          selected={date}
        />
      </PopoverContent>
      <input
        name={name}
        type="hidden"
        value={date ? format(date, "yyyy-MM-dd") : ""}
      />
    </Popover>
  )
}

export { DatePicker }
