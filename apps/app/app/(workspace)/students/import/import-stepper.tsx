import { CheckIcon } from "lucide-react";

const steps = ["Template", "Upload", "Review", "Import", "Complete"];

export const ImportStepper = ({ current }: { current: number }) => (
  <ol aria-label="Import progress" className="grid grid-cols-5 gap-2">
    {steps.map((step, index) => {
      const number = index + 1;
      const complete = number < current;
      const active = number === current;
      return (
        <li
          aria-current={active ? "step" : undefined}
          className={`grid justify-items-center gap-2 border-t-2 pt-3 text-center text-xs sm:text-sm ${
            active || complete
              ? "border-primary text-foreground"
              : "border-border text-muted-foreground"
          }`}
          key={step}
        >
          <span className="grid size-7 place-items-center rounded-full border font-medium">
            {complete ? <CheckIcon className="size-4" /> : number}
          </span>
          <span>{step}</span>
        </li>
      );
    })}
  </ol>
);
