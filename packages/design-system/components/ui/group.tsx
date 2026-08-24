import { Separator } from "@repo/design-system/components/ui/separator"
import { cn } from "@repo/design-system/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const groupVariants = cva(
  "flex items-stretch rounded-lg border border-border bg-card [&>*]:focus-visible:z-10 [&>*]:focus-visible:relative",
  {
    variants: {
      orientation: {
        horizontal:
          "w-fit [&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

function Group({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof groupVariants>) {
  return (
    <div
      role="group"
      data-slot="group"
      data-orientation={orientation}
      className={cn(groupVariants({ orientation }), className)}
      {...props}
    />
  )
}

function GroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="group-separator"
      orientation={orientation}
      className={cn(
        "bg-input relative !m-0 self-stretch data-[orientation=vertical]:h-auto",
        className
      )}
      {...props}
    />
  )
}

export { Group, GroupSeparator, groupVariants }
