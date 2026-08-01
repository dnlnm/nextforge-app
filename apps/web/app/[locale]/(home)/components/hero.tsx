import { ArrowRight, Wifi } from "lucide-react";

import { Button } from "@repo/design-system/components/ui/button";
import type { Dictionary } from "@repo/internationalization";
import { localizePath } from "@repo/internationalization";
import { env } from "@/env";

interface HeroProps {
  dictionary: Dictionary;
  locale: string;
}

export const Hero = ({ dictionary, locale }: HeroProps) => {
  const { global } = dictionary.web;
  const { meta, hero } = dictionary.web.home;

  return (
    <section className="overflow-hidden py-32">
      <div className="container mx-auto">
        <div className="flex flex-col gap-5">
          <div className="relative isolate flex flex-col gap-5">
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-1/2 -z-10 mx-auto size-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border mask-[linear-gradient(to_top,transparent,transparent,white,white,white,transparent,transparent)] p-16 [-webkit-mask-image:linear-gradient(to_top,transparent,transparent,white,white,white,transparent,transparent)] md:size-[1300px] md:p-32"
            >
              <div className="size-full rounded-full border border-border p-16 md:p-32">
                <div className="size-full rounded-full border border-border" />
              </div>
            </div>
            <span className="mx-auto flex size-16 items-center justify-center rounded-full border md:size-20">
              <Wifi className="size-6" />
            </span>
            <h1 className="mx-auto max-w-xl text-center text-4xl font-semibold tracking-tight text-pretty md:text-5xl lg:max-w-3xl lg:text-6xl">
              {meta.title}
            </h1>
            <p className="mx-auto max-w-5xl text-center text-lg text-balance text-muted-foreground md:text-xl">
              {meta.description}
            </p>
            <div className="flex flex-col items-center gap-3 pt-3 pb-12">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <a href={localizePath(locale, "/contact")}>
                  {global.primaryCta}
                  <ArrowRight className="size-4" />
                </a>
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                {hero.announcement}
              </div>
            </div>
          </div>
          <img
            src="https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/saas-hero/saas-hero-1-16x9.png"
            alt="Hero Image Placeholder"
            className="mx-auto aspect-3/4 h-full max-h-[524px] w-full max-w-5xl rounded-lg border border-border object-cover object-top-left md:aspect-video md:object-top dark:hidden"
          />
          <img
            src="https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/saas-hero/saas-hero-1-16x9-dark.png"
            alt="Hero Image Placeholder"
            className="mx-auto hidden aspect-3/4 h-full max-h-[524px] w-full max-w-5xl rounded-lg border border-border object-cover object-top-left md:aspect-video md:object-top dark:block"
          />
        </div>
      </div>
    </section>
  );
};
