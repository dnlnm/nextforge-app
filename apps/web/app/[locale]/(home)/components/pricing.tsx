import { PreviewCard } from "@repo/design-system/components/preview-card";
import { Button } from "@repo/design-system/components/ui/button";
import type { Dictionary } from "@repo/internationalization";
import { cn } from "@repo/design-system/lib/utils";
import { localizePath } from "@repo/internationalization";
import { Check, MoveRight } from "lucide-react";
import Link from "next/link";
import { env } from "@/env";

interface PricingProps {
  dictionary: Dictionary;
  locale: string;
  showFullComparison?: boolean;
}

export const Pricing = ({
  dictionary,
  locale,
  showFullComparison = false,
}: PricingProps) => (
  <div className="w-full scroll-mt-24 py-20 lg:py-28" id="pricing">
    <div className="container mx-auto">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <span className="inline-flex items-center rounded-full border bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {dictionary.web.home.pricing.badge}
        </span>
        <div className="flex flex-col gap-3">
          <h2 className="mx-auto max-w-[18ch] text-center font-heading text-3xl leading-none tracking-normal text-balance md:text-5xl">
            {dictionary.web.home.pricing.title}
          </h2>
          <p className="mx-auto max-w-[48ch] text-center text-[15px] leading-relaxed text-muted-foreground text-pretty">
            {dictionary.web.home.pricing.description}
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-5 pt-12 text-left lg:grid-cols-3 lg:items-stretch">
          {dictionary.web.home.pricing.plans.map((plan) => (
            <PreviewCard
              key={plan.name}
              className={cn(
                "flex w-full flex-col",
                plan.highlighted
                  ? "relative overflow-hidden border-foreground/20 shadow-lg lg:-mt-3 lg:scale-[1.02]"
                  : "shadow-md"
              )}
              footer={
                <Button className="w-full gap-2" render={<Link href={env.NEXT_PUBLIC_APP_URL} />}>
                  {plan.cta}
                  <MoveRight className="h-4 w-4" />
                </Button>
              }
              stageClassName="flex-col items-stretch gap-6 p-6"
            >
              {plan.highlighted && (
                <div
                  className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,var(--primary),color-mix(in_srgb,var(--primary)_60%,var(--background)))]"
                  aria-hidden
                />
              )}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {plan.name}
                  </p>
                  {plan.highlighted && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium tracking-wide text-foreground ring-1 ring-border">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-pretty pt-1 text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="flex flex-1 flex-col gap-6">
                <p className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl font-medium tracking-tight tabular-nums">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </p>
                <div className="h-px bg-border/70" aria-hidden />
                <div className="flex flex-1 flex-col gap-4">
                  {plan.features.map((feature) => (
                    <div className="flex gap-3" key={feature.title}>
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border">
                        <Check className="h-3 w-3 text-primary" />
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium leading-none">{feature.title}</p>
                        <p className="text-pretty text-sm leading-snug text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PreviewCard>
          ))}
        </div>
        {showFullComparison && (
          <Button
            className="mt-10 gap-4"
            render={<Link href={localizePath(locale, "/pricing")} />}
            variant="outline"
          >
            {dictionary.web.home.pricing.fullComparison}
            <MoveRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  </div>
);
