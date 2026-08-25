import { Button } from "@repo/design-system/components/ui/button";
import type { Dictionary } from "@repo/internationalization";
import { localizePath } from "@repo/internationalization";
import { MoveRight, PhoneCall } from "lucide-react";
import Link from "next/link";
import { env } from "@/env";

interface CTAProps {
  dictionary: Dictionary;
  locale: string;
}

export const CTA = ({ dictionary, locale }: CTAProps) => (
  <div className="w-full py-20 lg:py-28">
    <div className="container mx-auto">
      <div className="relative flex flex-col items-center gap-8 overflow-hidden rounded-[24px] border bg-card p-8 text-center shadow-lg lg:p-14">
        <div className="absolute inset-0 -z-10" aria-hidden>
          <img src="https://picsum.photos/seed/klio-cta/1600/600" alt="" className="h-full w-full object-cover opacity-[0.06]" />
          <div className="absolute inset-0 bg-[radial-gradient(800px_circle_at_50%_-10%,color-mix(in_oklab,var(--foreground)_14%,transparent),transparent_60%)]" />
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="mx-auto max-w-[20ch] font-heading text-3xl leading-none tracking-[-0.03em] text-balance md:text-5xl">
            {dictionary.web.home.cta.title}
          </h3>
          <p className="mx-auto max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground text-pretty">
            {dictionary.web.home.cta.description}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="gap-2"
            variant="outline"
            render={<Link href={localizePath(locale, "/contact")} />}
          >
            {dictionary.web.global.primaryCta} <PhoneCall className="h-4 w-4" />
          </Button>
          <Button
            className="gap-2"
            render={<Link href={env.NEXT_PUBLIC_APP_URL} />}
          >
            {dictionary.web.global.secondaryCta}{" "}
            <MoveRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
);
