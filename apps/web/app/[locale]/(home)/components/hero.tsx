import { ArrowRight, GraduationCap } from "lucide-react";

import { Button } from "@repo/design-system/components/ui/button";
import type { Dictionary } from "@repo/internationalization";
import { localizePath } from "@repo/internationalization";

interface HeroProps {
  dictionary: Dictionary;
  locale: string;
}

export const Hero = ({ dictionary, locale }: HeroProps) => {
  const { global } = dictionary.web;
  const { meta, hero } = dictionary.web.home;

  return (
    <section className="relative overflow-hidden">
      {/* ambient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_oklab,var(--foreground)_8%,transparent),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      </div>
      <div className="container mx-auto">
        <div className="flex flex-col gap-8 pt-20 pb-10 lg:pt-28 lg:pb-12">
          <div className="relative isolate flex flex-col gap-6">
            <div
              aria-hidden
              className="pointer-events-none absolute top-[42%] left-1/2 -z-10 size-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/60 mask-[linear-gradient(to_top,transparent,transparent,white,white,white,transparent,transparent)] p-16 [-webkit-mask-image:linear-gradient(to_top,transparent,transparent,white,white,white,transparent,transparent)] md:size-[1180px] md:p-28"
            >
              <div className="size-full rounded-full border border-border/60 p-16 md:p-28">
                <div className="size-full rounded-full border border-border/40" />
              </div>
            </div>
            <span className="mx-auto inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5 text-xs font-medium tracking-wide text-muted-foreground shadow-sm backdrop-blur">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent">
                <GraduationCap className="size-3.5" />
              </span>
              {hero.announcement}
            </span>
            <h1 className="mx-auto max-w-[22ch] text-center font-heading text-5xl leading-[0.95] tracking-[-0.04em] text-balance md:text-6xl">
              {meta.title}
            </h1>
            <p className="mx-auto max-w-[52ch] text-center text-[15px] leading-relaxed text-muted-foreground text-balance md:text-[17px]">
              {meta.description}
            </p>
            <div className="flex flex-col items-center gap-3 pt-2">
              <Button
                size="lg"
                className="w-full shadow-sm sm:w-auto"
                render={<a href={localizePath(locale, "/contact")} />}
              >
                {global.primaryCta}
                <ArrowRight className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground">14-day trial · No card required</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-5xl">
            <div className="relative overflow-hidden rounded-[20px] border bg-card shadow-lg">
              <img
                src="https://picsum.photos/seed/klio-classroom/1600/900"
                alt="Tuition centre classroom — students at desks"
                className="aspect-[16/9] w-full object-cover dark:hidden"
                loading="eager"
              />
              <img
                src="https://picsum.photos/seed/klio-classroom-dark/1600/900"
                alt="Tuition centre classroom — students at desks"
                className="hidden aspect-[16/9] w-full object-cover dark:block"
                loading="eager"
              />
              <div className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-black/5 dark:ring-white/10" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/70 to-transparent" />
            </div>
            <div className="pointer-events-none absolute -bottom-6 -right-2 hidden h-16 w-32 rounded-xl border bg-background/90 shadow-sm backdrop-blur lg:block" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
};
