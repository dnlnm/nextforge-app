import type { Dictionary } from "@repo/internationalization";
import {
  CalendarRange,
  GraduationCap,
  Receipt,
  UsersRound,
} from "lucide-react";

interface FeaturesProps {
  dictionary: Dictionary;
}

const icons = [UsersRound, CalendarRange, Receipt, GraduationCap] as const;

export const Features = ({ dictionary }: FeaturesProps) => (
  <div className="w-full scroll-mt-24 py-20 lg:py-28" id="features">
    <div className="container mx-auto">
      <div className="flex flex-col gap-10">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.85fr] lg:items-end">
          <h2 className="max-w-[18ch] text-left font-heading text-3xl leading-none tracking-normal text-balance md:text-5xl">
            {dictionary.web.home.features.title}
          </h2>
          <p className="max-w-[42ch] text-left text-[15px] leading-relaxed text-muted-foreground text-pretty lg:justify-self-end lg:text-right">
            {dictionary.web.home.features.description}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
          {dictionary.web.home.features.items.map((item, i) => {
            const Icon = icons[i % icons.length];
            const span =
              i === 0 || i === 3 ? "sm:col-span-7" : "sm:col-span-5";
            return (
              <div
                key={item.title}
                className={`group relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-2xl border bg-card p-7 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 ${span}`}
              >
                <div className="absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
                  <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_0%_0%,color-mix(in_oklab,var(--foreground)_7%,transparent),transparent_60%)]" />
                </div>
                <span className="flex size-9 items-center justify-center rounded-xl border bg-muted">
                  <Icon className="size-[18px] stroke-[1.6]" />
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-[17px] font-medium tracking-tight">
                    {item.title}
                  </h3>
                  <p className="max-w-[32ch] text-sm leading-relaxed text-muted-foreground text-pretty">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);
