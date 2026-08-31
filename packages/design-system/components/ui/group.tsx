import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { Separator } from "@repo/design-system/components/ui/separator"
import { cn } from "@repo/design-system/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"

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

function GroupText({
  className,
  render,
  ...props
}: React.ComponentProps<"div"> & { render?: React.ReactElement }) {
  const defaultProps = {
    className: cn(
      "flex shrink-0 items-center bg-transparent px-3 text-sm font-medium text-muted-foreground",
      className,
    ),
    "data-slot": "group-text" as const,
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export { Group, GroupSeparator, GroupText, groupVariants }
