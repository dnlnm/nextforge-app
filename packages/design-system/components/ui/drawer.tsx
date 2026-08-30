"use client";

import * as React from "react";

import { cn } from "@repo/design-system/lib/utils";
import {
  Drawer as TrovecnDrawer,
  DrawerClose as TrovecnClose,
  DrawerContent as TrovecnContent,
  DrawerDescription as TrovecnDescription,
  DrawerHeader as TrovecnHeader,
  DrawerOverlay as TrovecnOverlay,
  DrawerPortal as TrovecnPortal,
  DrawerTitle as TrovecnTitle,
  DrawerTrigger as TrovecnTrigger,
} from "../trovecn/drawer";

// Position compat: old coss Drawer used `position` prop, trovecn uses `side` on content.
// Provide context so DrawerPopup/Content can infer side from parent Drawer.
type Side = "top" | "right" | "bottom" | "left";

const DrawerPositionContext = React.createContext<Side | null>(null);

function Drawer({
  position,
  ...props
}: React.ComponentProps<typeof TrovecnDrawer> & { position?: Side }) {
  const side: Side = position ?? "bottom";
  return (
    <DrawerPositionContext.Provider value={side}>
      <TrovecnDrawer {...props} />
    </DrawerPositionContext.Provider>
  );
}

function DrawerTrigger(props: React.ComponentProps<typeof TrovecnTrigger>) {
  return <TrovecnTrigger {...props} />;
}

function DrawerClose(props: React.ComponentProps<typeof TrovecnClose>) {
  return <TrovecnClose {...props} />;
}

const DrawerPortal = TrovecnPortal;
const DrawerOverlay = TrovecnOverlay;

function DrawerContent({
  side,
  position,
  showHandle,
  className,
  children,
  ...props
}: React.ComponentProps<typeof TrovecnContent> & {
  position?: Side;
  showHandle?: boolean;
}) {
  const ctxSide = React.useContext(DrawerPositionContext);
  const resolvedSide: Side = side ?? position ?? ctxSide ?? "bottom";
  return (
    <TrovecnContent className={className} showHandle={showHandle} side={resolvedSide} {...props}>
      {children}
    </TrovecnContent>
  );
}

// Popup is the coss name for the same surface — alias with position/side translation.
function DrawerPopup({
  side,
  position,
  variant,
  showCloseButton: _showCloseButton,
  showBar: _showBar,
  portalProps: _portalProps,
  className,
  children,
  ...props
}: React.ComponentProps<typeof TrovecnContent> & {
  position?: Side;
  variant?: string;
  showCloseButton?: boolean;
  showBar?: boolean;
  portalProps?: unknown;
}) {
  const ctxSide = React.useContext(DrawerPositionContext);
  const resolvedSide: Side = side ?? position ?? ctxSide ?? "bottom";
  // variant/inset etc are ignored — trovecn content already handles side + handle.
  void variant;
  void _showCloseButton;
  void _showBar;
  void _portalProps;
  return (
    <TrovecnContent className={className} side={resolvedSide} {...props}>
      {children}
    </TrovecnContent>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<typeof TrovecnHeader>) {
  return <TrovecnHeader className={className} {...props} />;
}

function DrawerTitle(props: React.ComponentProps<typeof TrovecnTitle>) {
  return <TrovecnTitle {...props} />;
}

function DrawerDescription(props: React.ComponentProps<typeof TrovecnDescription>) {
  return <TrovecnDescription {...props} />;
}

// Simple compat containers — trovecn has no Footer/Panel, provide divs.
function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("flex flex-col-reverse gap-2 p-6 pt-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function DrawerPanel({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-panel" className={cn("flex-1 overflow-auto p-6 pt-2", className)} {...props} />;
}

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerPopup,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerPanel,
};
