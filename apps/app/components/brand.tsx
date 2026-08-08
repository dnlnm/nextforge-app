import { GraduationCapIcon } from "lucide-react";

export const Brand = () => (
  <div className="flex h-9 items-center gap-2 text-primary">
    <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <GraduationCapIcon className="size-4" />
    </div>
    <span className="font-semibold leading-none">TLAS.MY</span>
  </div>
);
