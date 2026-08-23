import { CheckIcon } from "lucide-react";

const steps = ["Template", "Upload", "Review", "Import", "Complete"] as const;

export const ImportStepper = ({ current }: { current: number }) => (
  <div className="overflow-hidden rounded-xl border bg-card">
    <ol
      aria-label="Import progress"
      className="grid grid-cols-5 gap-2 p-3 sm:p-4"
    >
      {steps.map((step, index) => {
        const number = index + 1;
        const complete = number < current;
        const active = number === current;
        return (
          <li
            aria-current={active ? "step" : undefined}
            className="relative grid justify-items-center gap-2 text-center"
            key={step}
          >
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className={`pointer-events-none absolute top-3.5 left-[calc(50%+16px)] hidden h-px w-[calc(100%-32px)] sm:block ${
                  complete ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <span
              className={`grid size-7 place-items-center rounded-full border text-xs font-medium tabular-nums ${
                complete || active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted text-muted-foreground"
              } ${active ? "ring-2 ring-primary/20" : ""}`}
            >
              {complete ? <CheckIcon className="size-4" /> : number}
            </span>
            <span
              className={`hidden text-xs sm:block ${
                active
                  ? "font-medium text-foreground"
                  : complete
                    ? "text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {step}
            </span>
            <span
              className={`text-[11px] sm:hidden ${
                active ? "font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.slice(0, 3)}
            </span>
          </li>
        );
      })}
    </ol>
  </div>
);
