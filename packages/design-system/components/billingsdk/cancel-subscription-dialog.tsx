"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import type { Plan } from "@repo/design-system/lib/billingsdk-config";
import { cn } from "@repo/design-system/lib/utils";
import { Circle, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export interface CancelSubscriptionDialogProps {
  className?: string;
  confirmButtonText?: string;
  continueButtonText?: string;
  description: string;
  finalSubtitle?: string;
  finalTitle?: string;
  finalWarningText?: string;
  goBackButtonText?: string;
  keepButtonText?: string;
  leftPanelImageUrl?: string;
  onCancel: (planId: string) => Promise<void> | void;
  onDialogClose?: () => void;
  onKeepSubscription?: (planId: string) => Promise<void> | void;
  plan: Plan;
  title: string;
  triggerButtonText?: string;
  warningText?: string;
  warningTitle?: string;
}

export function CancelSubscriptionDialog({
  title,
  description,
  plan,
  triggerButtonText,
  leftPanelImageUrl,
  warningTitle,
  warningText,
  keepButtonText,
  continueButtonText,
  finalTitle,
  finalSubtitle,
  finalWarningText,
  goBackButtonText,
  confirmButtonText,
  onCancel,
  onKeepSubscription,
  onDialogClose,
  className,
}: CancelSubscriptionDialogProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinueCancellation = () => {
    setShowConfirmation(true);
    setError(null);
  };

  const handleConfirmCancellation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onCancel(plan.id);
      handleDialogClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel subscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeepSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (onKeepSubscription) {
        await onKeepSubscription(plan.id);
      }
      handleDialogClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to keep subscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = useCallback(() => {
    setIsOpen(false);
    setShowConfirmation(false);
    setError(null);
    setIsLoading(false);
    onDialogClose?.();
  }, [onDialogClose]);

  const handleGoBack = () => {
    setShowConfirmation(false);
    setError(null);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        handleDialogClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleDialogClose]);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) {
          setIsOpen(true);
        } else {
          handleDialogClose();
        }
      }}
      open={isOpen}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        {triggerButtonText || "Cancel Subscription"}
      </DialogTrigger>
      <DialogContent
        className={cn(
          "flex w-[95%] flex-col overflow-hidden p-0 text-foreground sm:max-w-[1000px] md:w-[100%] md:flex-row",
          leftPanelImageUrl ? "" : "sm:max-w-[500px]",
          className
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogClose
          className="absolute top-4 right-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={handleDialogClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        {leftPanelImageUrl && <CancelDialogImage src={leftPanelImageUrl} />}
        <div
          className={cn(
            "flex flex-col gap-4 px-4 py-6",
            leftPanelImageUrl ? "w-full md:w-1/2" : "w-full"
          )}
        >
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h2 className="font-semibold text-xl md:text-2xl">{title}</h2>
            <p className="text-muted-foreground text-xs md:text-sm">
              {description}
            </p>
            {error && <ErrorBox message={error} />}
          </div>

          {!showConfirmation && (
            <>
              <PlanDetails plan={plan} />
              {warningTitle || warningText ? (
                <WarningBox text={warningText} title={warningTitle} />
              ) : null}
            </>
          )}
          {showConfirmation ? (
            <ConfirmationActions
              confirmButtonText={confirmButtonText}
              finalSubtitle={finalSubtitle}
              finalTitle={finalTitle}
              finalWarningText={finalWarningText}
              goBackButtonText={goBackButtonText}
              isLoading={isLoading}
              onConfirm={handleConfirmCancellation}
              onGoBack={handleGoBack}
            />
          ) : (
            <InitialActions
              continueButtonText={continueButtonText}
              isLoading={isLoading}
              keepButtonText={keepButtonText}
              onContinue={handleContinueCancellation}
              onKeep={handleKeepSubscription}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ImgProps {
  readonly src: string;
}

const CancelDialogImage = ({ src }: ImgProps) => (
  <div className="relative hidden min-h-[500px] w-full overflow-hidden md:block md:w-1/2">
    {/* biome-ignore lint/performance/noImgElement: dynamic image url in framework-agnostic package */}
    <img
      alt="Cancel Subscription"
      className="absolute inset-0 h-full w-full object-cover"
      height={500}
      src={src}
      width={1000}
    />
    <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent via-background/30 to-background/90 dark:block" />
    <div className="absolute inset-0 hidden bg-gradient-to-t from-background/80 via-transparent to-background/20 dark:block" />
  </div>
);

interface ErrorBoxProps {
  readonly message: string;
}

const ErrorBox = ({ message }: ErrorBoxProps) => (
  <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
    <p className="text-destructive text-sm">{message}</p>
  </div>
);

interface PlanDetailsProps {
  readonly plan: Plan;
}

const PlanDetails = ({ plan }: PlanDetailsProps) => (
  <div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4">
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-lg">{plan.title} Plan</span>
        <span className="text-muted-foreground text-sm">
          Current subscription
        </span>
      </div>
      <Badge variant="secondary">
        {Number.parseFloat(plan.monthlyPrice) >= 0
          ? `${plan.currency}${plan.monthlyPrice}/monthly`
          : `${plan.monthlyPrice}/monthly`}
      </Badge>
    </div>
    <div className="flex flex-col gap-2">
      {plan.features.slice(0, 4).map((feature) => (
        <div className="flex items-center gap-2" key={feature.name}>
          <Circle className="h-2 w-2 fill-primary text-primary" />
          <span className="text-muted-foreground text-sm">{feature.name}</span>
        </div>
      ))}
    </div>
  </div>
);

interface WarningBoxProps {
  readonly text?: string;
  readonly title?: string;
}

const WarningBox = ({ title, text }: WarningBoxProps) => (
  <div className="rounded-lg border border-border bg-muted/30 p-4">
    {title && <h3 className="mb-2 font-semibold text-foreground">{title}</h3>}
    {text && <p className="text-muted-foreground text-sm">{text}</p>}
  </div>
);

interface ConfirmationActionsProps {
  readonly confirmButtonText?: string;
  readonly finalSubtitle?: string;
  readonly finalTitle?: string;
  readonly finalWarningText?: string;
  readonly goBackButtonText?: string;
  readonly isLoading: boolean;
  readonly onConfirm: () => Promise<void>;
  readonly onGoBack: () => void;
}

const ConfirmationActions = ({
  finalTitle,
  finalSubtitle,
  finalWarningText,
  goBackButtonText,
  confirmButtonText,
  isLoading,
  onGoBack,
  onConfirm,
}: ConfirmationActionsProps) => (
  <div className="mt-auto flex flex-col gap-4">
    <div className="rounded-lg bg-muted/50 p-4 text-center">
      <h3 className="mb-2 font-semibold text-foreground">
        {finalTitle || "Final Confirmation"}
      </h3>
      <p className="mb-2 text-muted-foreground text-sm">
        {finalSubtitle || "Are you sure you want to cancel your subscription?"}
      </p>
      <p className="text-destructive text-sm">
        {finalWarningText ||
          "This action cannot be undone and you'll lose access to all premium features."}
      </p>
    </div>
    <div className="flex flex-col gap-3 lg:flex-row">
      <Button
        className="flex-1"
        disabled={isLoading}
        onClick={onGoBack}
        variant="outline"
      >
        {goBackButtonText || "Go Back"}
      </Button>
      <Button
        className="flex-1"
        disabled={isLoading}
        onClick={onConfirm}
        variant="destructive"
      >
        {isLoading
          ? "Cancelling..."
          : confirmButtonText || "Yes, Cancel Subscription"}
      </Button>
    </div>
  </div>
);

interface InitialActionsProps {
  readonly continueButtonText?: string;
  readonly isLoading: boolean;
  readonly keepButtonText?: string;
  readonly onContinue: () => void;
  readonly onKeep: () => void;
}

const InitialActions = ({
  keepButtonText,
  continueButtonText,
  isLoading,
  onKeep,
  onContinue,
}: InitialActionsProps) => (
  <div className="mt-auto flex flex-col gap-3 lg:flex-row">
    <Button className="flex-1" disabled={isLoading} onClick={onKeep}>
      {isLoading ? "Processing..." : keepButtonText || "Keep My Subscription"}
    </Button>
    <Button
      className="flex-1"
      disabled={isLoading}
      onClick={onContinue}
      variant="destructive"
    >
      {continueButtonText || "Continue Cancellation"}
    </Button>
  </div>
);
