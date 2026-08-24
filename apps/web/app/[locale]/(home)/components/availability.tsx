import type { Dictionary } from "@repo/internationalization";
import { Copy, Minus, Plus } from "lucide-react";

interface AvailabilityProps {
  dictionary: Dictionary;
}

export const Availability = ({ dictionary }: AvailabilityProps) => {
  const { availability } = dictionary.web.home;
  const { card } = availability;

  return (
    <div className="w-full py-20 lg:py-28" id="availability">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-4">
            <h2 className="max-w-[18ch] text-balance text-left font-heading text-3xl leading-none tracking-[-0.03em] md:text-5xl">
              {availability.title}
            </h2>
            <p className="max-w-[42ch] text-pretty text-left text-[15px] text-muted-foreground leading-relaxed">
              {availability.description}
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-[20px] border bg-card shadow-panel">
            <div className="flex flex-col gap-2.5 p-6">
              <span className="inline-flex h-7 w-12 items-center justify-center rounded-lg border bg-muted font-mono font-semibold text-muted-foreground text-sm">
                {card.step}
              </span>
              <h3 className="mt-1 font-semibold text-[15px] tracking-tight">
                {card.title}
              </h3>
              <p className="max-w-[30ch] text-pretty text-muted-foreground text-sm leading-relaxed">
                {card.description}
              </p>
            </div>

            <div className="border-t">
              {card.rows.map((row, i) => {
                const [startTime, startMeridiem] = row.start.split(" ");
                const [endTime, endMeridiem] = row.end.split(" ");
                return (
                  <div
                    className="flex items-center gap-3 px-6 py-3.5"
                    key={row.day}
                  >
                    <span
                      aria-hidden
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full ${
                        i === 1 ? "bg-foreground" : "bg-input"
                      }`}
                    >
                      <span
                        className="absolute size-5 rounded-full bg-background shadow-sm transition-transform"
                        style={{
                          transform:
                            i === 1
                              ? "translateX(calc(100% - 2px))"
                              : "translateX(2px)",
                        }}
                      />
                    </span>
                    <span className="w-9 shrink-0 text-foreground text-sm">
                      {row.day}
                    </span>
                    <span className="flex min-w-[44px] flex-col items-center rounded-lg border px-2 py-1 leading-none">
                      <span className="font-medium text-[13px] text-foreground">
                        {startTime}
                      </span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground">
                        {startMeridiem}
                      </span>
                    </span>
                    <Minus
                      aria-hidden
                      className="size-3.5 shrink-0 text-muted-foreground"
                    />
                    <span className="flex min-w-[44px] flex-col items-center rounded-lg border px-2 py-1 leading-none">
                      <span className="font-medium text-[13px] text-foreground">
                        {endTime}
                      </span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground">
                        {endMeridiem}
                      </span>
                    </span>
                    <Plus
                      aria-hidden
                      className="ml-auto size-4 shrink-0 text-foreground/70"
                    />
                    <Copy
                      aria-hidden
                      className="size-4 shrink-0 text-foreground/70"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
