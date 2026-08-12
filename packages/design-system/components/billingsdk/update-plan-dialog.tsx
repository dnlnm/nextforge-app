"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import { Label } from "@repo/design-system/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@repo/design-system/components/ui/radio-group";
import type { Plan } from "@repo/design-system/lib/billingsdk-config";
import { cn } from "@repo/design-system/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";

export interface UpdatePlanDialogProps {
  className?: string;
  currentPlan: Plan;
  onPlanChange: (planId: string) => void;
  plans: Plan[];
  title?: string;
  triggerText: string;
}

const easing = [0.4, 0, 0.2, 1] as const;

export function UpdatePlanDialog({
  currentPlan,
  plans,
  onPlanChange,
  className,
  title,
  triggerText,
}: UpdatePlanDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(
    undefined
  );
  const [isOpen, setIsOpen] = useState(false);

  const handlePlanChange = useCallback((planId: string) => {
    setSelectedPlan((prev) => (prev === planId ? undefined : planId));
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedPlan(undefined);
    }
  }, []);

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogTrigger render={<Button />}>
        {triggerText || "Update Plan"}
      </DialogTrigger>
      <DialogContent
        className={cn(
          "flex max-h-[95vh] flex-col gap-3 text-foreground sm:max-h-[90vh] sm:gap-4",
          "w-[calc(100vw-2rem)] max-w-2xl sm:w-full",
          "p-4 sm:p-6",
          className
        )}
      >
        <DialogHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-0">
          <DialogTitle className="font-semibold text-lg sm:text-xl">
            {title || "Upgrade Plan"}
          </DialogTitle>
        </DialogHeader>
        <div
          className="-mx-4 min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 sm:-mx-6 sm:px-6 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-muted hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "hsl(var(--muted)) transparent",
          }}
        >
          {plans.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-center">
              <p className="text-muted-foreground text-sm">
                No plans available
              </p>
            </div>
          ) : (
            <RadioGroup onValueChange={handlePlanChange} value={selectedPlan}>
              <div className="space-y-2.5 pr-0.5 pb-2 sm:space-y-3">
                {plans.map((plan, index) => (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    aria-pressed={selectedPlan === plan.id}
                    className={cn(
                      "relative cursor-pointer overflow-hidden rounded-lg border transition-all duration-200 sm:rounded-xl",
                      "touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      selectedPlan === plan.id
                        ? "border-primary bg-gradient-to-br from-muted/60 to-muted/30 shadow-sm"
                        : "border-border hover:border-primary/50"
                    )}
                    initial={{ opacity: 0, y: 20 }}
                    key={plan.id}
                    layout
                    onClick={() => handlePlanChange(plan.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handlePlanChange(plan.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    transition={{
                      layout: { duration: 0.3, ease: easing },
                      opacity: {
                        delay: index * 0.05,
                        duration: 0.3,
                        ease: easing,
                      },
                      y: { delay: index * 0.05, duration: 0.3, ease: easing },
                    }}
                  >
                    <motion.div className="p-3 sm:p-4" layout="position">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex min-w-0 flex-1 gap-2 sm:gap-3">
                          <RadioGroupItem
                            className="pointer-events-none mt-0.5 flex-shrink-0 sm:mt-1"
                            id={plan.id}
                            value={plan.id}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <Label
                                className="cursor-pointer font-semibold text-sm leading-tight sm:font-medium sm:text-base"
                                htmlFor={plan.id}
                              >
                                {plan.title}
                              </Label>
                              {plan.badge && (
                                <Badge
                                  className="h-5 flex-shrink-0 px-1.5 py-0 text-[10px] sm:h-auto sm:px-2 sm:py-0.5 sm:text-xs"
                                  variant="secondary"
                                >
                                  {plan.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed sm:text-xs">
                              {plan.description}
                            </p>
                            {plan.features.length > 0 && (
                              <div className="pt-2 sm:pt-3">
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                  {plan.features.map((feature) => (
                                    <div
                                      className="flex flex-shrink-0 items-center gap-1.5 rounded-md border border-border/30 bg-muted/20 px-2 py-1 sm:gap-2 sm:rounded-lg"
                                      key={feature.name}
                                    >
                                      <div className="h-1 w-1 flex-shrink-0 rounded-full bg-primary sm:h-1.5 sm:w-1.5" />
                                      <span className="whitespace-nowrap text-[10px] text-muted-foreground leading-none sm:text-xs">
                                        {feature.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="min-w-[60px] flex-shrink-0 text-right sm:min-w-[80px]">
                          <div className="font-bold text-base leading-tight sm:font-semibold sm:text-xl">
                            {Number.parseFloat(getMonthlyPrice(plan)) >= 0
                              ? `${plan.currency}${getMonthlyPrice(plan)}`
                              : getMonthlyPrice(plan)}
                          </div>
                          <div className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">
                            /month
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <AnimatePresence initial={false}>
                      {selectedPlan === plan.id && (
                        <motion.div
                          animate={{
                            height: "auto",
                            opacity: 1,
                            transition: {
                              height: { duration: 0.3, ease: easing },
                              opacity: {
                                duration: 0.25,
                                delay: 0.05,
                                ease: easing,
                              },
                            },
                          }}
                          className="overflow-hidden"
                          exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                              height: { duration: 0.25, ease: easing },
                              opacity: { duration: 0.15, ease: easing },
                            },
                          }}
                          initial={{ height: 0, opacity: 0 }}
                        >
                          <motion.div
                            animate={{
                              y: 0,
                              transition: {
                                duration: 0.25,
                                delay: 0.05,
                                ease: easing,
                              },
                            }}
                            className="px-3 pb-3 sm:px-4 sm:pb-4"
                            exit={{ y: -8 }}
                            initial={{ y: -8 }}
                          >
                            <Button
                              className="h-10 w-full touch-manipulation font-medium text-sm sm:h-11 sm:text-base"
                              disabled={selectedPlan === currentPlan.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlanChange(plan.id);
                                handleOpenChange(false);
                              }}
                            >
                              {selectedPlan === currentPlan.id
                                ? "Current Plan"
                                : "Upgrade"}
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const getMonthlyPrice = (plan: Plan) => plan.monthlyPrice;
