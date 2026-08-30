"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@repo/design-system/lib/utils";
import { spring } from "@repo/design-system/lib/springs";
import {
  useProximityHover,
  proximityHoverWashClassName,
  proximityHoverWashOpacity,
} from "@repo/design-system/hooks/use-proximity-hover";

// ─── Proximity hover ─────────────────────────────────────────────────────────
// Every SelectContent popup owns one useProximityHover instance — the same
// measured-rect hover wash Menu/Combobox use, scoped to the popup's own
// items. Base UI's `data-highlighted` (keyboard nav and pointer hover both
// set it) still drives each row's text color, same split the menu uses
// between its pill-owns-background and item-owns-text-color.

interface SelectProximityContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
}

const SelectProximityContext = createContext<SelectProximityContextValue | null>(null);

/** Position for proximity hover — auto-assigned by SelectContent's child walk. */
type SelectIndexProp = { _index?: number };

function useSelectItemRegistration(ref: React.RefObject<HTMLElement | null>, index?: number) {
  const ctx = useContext(SelectProximityContext);
  useEffect(() => {
    if (index === undefined || !ctx) return;
    ctx.registerItem(index, ref.current);
    return () => ctx.registerItem(index, null);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [index, ctx]);
}

/**
 * Auto-indexes SelectContent's children so callers never hand-thread an index
 * just for proximity hover — mirrors MenuContent's indexMenuChildren.
 * Indexable rows sit one level down inside a SelectGroup, so the walk
 * recurses into groups rather than staying a flat Children.map.
 */
function indexSelectChildren(children: ReactNode, counter: { current: number }): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    if (child.type === SelectGroup) {
      const groupProps = child.props as { children?: ReactNode };
      return cloneElement(child as ReactElement<{ children?: ReactNode }>, {
        children: indexSelectChildren(groupProps.children, counter),
      });
    }
    if (child.type === SelectItem) {
      return cloneElement(child as ReactElement<SelectIndexProp>, { _index: counter.current++ });
    }
    return child;
  });
}

// ─── Select ──────────────────────────────────────────────────────────────────

function Select<Value, Multiple extends boolean | undefined = false>({
  ...props
}: SelectPrimitive.Root.Props<Value, Multiple>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

const selectTriggerVariants = cva(
  "inline-flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg not-dark:bg-clip-padding px-2.5 text-left text-sm text-foreground outline-none transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-quick select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:transition-none hover:bg-muted hover:text-foreground active:duration-fast active:not-aria-[haspopup]:translate-y-px active:not-aria-[haspopup]:scale-[0.98] data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: {
      size: "default",
      variant: "elevated",
    },
    variants: {
      variant: {
        default:
          "border border-input bg-background dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        elevated:
          "shadow-bevel border border-border bg-background dark:border-input dark:bg-input/30",
      },
      size: {
        default: "",
        sm: "h-7",
        lg: "h-9",
      },
    },
  },
);

function SelectTrigger({
  className,
  size = "default",
  variant = "elevated",
  children,
  ...props
}: SelectPrimitive.Trigger.Props &
  VariantProps<typeof selectTriggerVariants>): React.ReactElement {
  return (
    <SelectPrimitive.Trigger
      className={cn(selectTriggerVariants({ size, variant }), className)}
      data-slot="select-trigger"
      data-variant={variant}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon data-slot="select-icon">
        <ChevronDownIcon className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectValue({
  className,
  ...props
}: SelectPrimitive.Value.Props): React.ReactElement {
  return (
    <SelectPrimitive.Value
      className={cn(
        "flex-1 truncate data-placeholder:text-muted-foreground",
        className,
      )}
      data-slot="select-value"
      {...props}
    />
  );
}

/**
 * Anchored floating list — same elevation step as Menu/Combobox, entering
 * from a small scale on `spring.moderate`. Matches the trigger's width
 * (`w-(--anchor-width)`) the way ComboboxPopup does, and carries the
 * proximity-hover wash across its items.
 */
function SelectContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 6,
  className,
  children,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<SelectPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { activeIndex, itemRects, handlers, registerItem, measureItems } = useProximityHover(
    containerRef,
    { axis: "y" },
  );

  useEffect(() => {
    measureItems();
  }, [measureItems, children]);

  const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;
  const indexedChildren = indexSelectChildren(children, { current: 0 });
  // Without this, `{ registerItem }` is a fresh object every render, so
  // every item's registration effect (keyed on this context value) re-fires
  // every render, bumps useProximityHover's registerTick, and re-renders
  // this popup — an infinite loop caught as "Maximum update depth
  // exceeded." `registerItem` itself is already a stable useCallback.
  const proximityContextValue = useMemo(() => ({ registerItem }), [registerItem]);
  const reduced = reduceMotion;

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        data-slot="select-positioner"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="z-50 outline-none"
      >
        <SelectPrimitive.Popup
          ref={containerRef}
          data-slot="select-content"
          render={(popupProps, state) => {
            const exiting = state.transitionStatus === "ending";
            return (
              <motion.div
                {...(popupProps as Record<string, unknown>)}
                {...(props as Record<string, unknown>)}
                onMouseMove={handlers.onMouseMove}
                onMouseEnter={handlers.onMouseEnter}
                onMouseLeave={handlers.onMouseLeave}
                className={cn(
                  "relative z-50 max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-popover outline-none",
                  className,
                )}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                animate={exiting ? { opacity: 0 } : { opacity: 1, scale: 1 }}
                transition={exiting ? spring.moderate.exit : spring.moderate.enter}
              >
                <AnimatePresence>
                  {activeRect && (
                    <motion.div
                      className={cn(
                        "pointer-events-none absolute left-1 right-1 rounded-md",
                        proximityHoverWashClassName,
                      )}
                      initial={{
                        opacity: 0,
                        top: activeRect.top,
                        height: activeRect.height,
                      }}
                      animate={{
                        opacity: proximityHoverWashOpacity,
                        top: activeRect.top,
                        height: activeRect.height,
                      }}
                      exit={{ opacity: 0, transition: spring.fast.exit }}
                      transition={spring.fast.enter}
                    />
                  )}
                </AnimatePresence>
                <SelectProximityContext.Provider value={proximityContextValue}>
                  {indexedChildren}
                </SelectProximityContext.Provider>
              </motion.div>
            );
          }}
        />
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectList({ className, ...props }: SelectPrimitive.List.Props) {
  return (
    <SelectPrimitive.List
      data-slot="select-list"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    />
  );
}

function SelectGroup({ ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectGroupLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props): React.ReactElement {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-group-label"
      className={cn("px-2 py-1.5 text-label text-muted-foreground uppercase", className)}
      {...props}
    />
  );
}

function SelectLabel({ className, ...props }: SelectPrimitive.Label.Props) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("inline-flex items-center gap-2 text-sm font-medium", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  _index,
  ...props
}: SelectPrimitive.Item.Props & SelectIndexProp) {
  const ref = useRef<HTMLDivElement>(null);
  useSelectItemRegistration(ref, _index);

  return (
    <SelectPrimitive.Item
      ref={ref}
      data-slot="select-item"
      className={cn(
        // Persistent selected-item tint, not the transient proximity-hover
        // wash below (--hover). --active is the same foreground-tint
        // mechanism as the hover wash, at a constant, clearly stronger
        // opacity, so "selected" reads heavier than a passing hover.
        "relative z-10 flex w-full cursor-default items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-control text-muted-foreground outline-none transition-colors select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:text-foreground data-[selected]:bg-active data-[selected]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-muted-foreground data-highlighted:[&_svg]:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="select-item-indicator"
      >
        {/* Selection indicators are `spring.fast` — the same tier and pattern
            as MenuCheckboxItem's check mark. `keepMounted` lets framer play
            the pop-out when a different item is selected instead of Base UI
            unmounting it first. */}
        <SelectPrimitive.ItemIndicator
          keepMounted
          render={(indicatorProps, state) => {
            const visible = state.selected && state.transitionStatus !== "ending";
            return (
              <motion.span
                {...(indicatorProps as Record<string, unknown>)}
                initial={false}
                animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.5 }}
                transition={visible ? spring.fast.enter : spring.fast.exit}
              >
                <CheckIcon className="size-3.5" />
              </motion.span>
            );
          }}
        />
      </span>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectList,
  SelectGroup,
  SelectGroupLabel,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};