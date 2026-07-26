import { GraduationCapIcon } from "lucide-react";

export const Brand = () => (
  <div className="flex items-center gap-2 font-semibold text-primary">
    <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <GraduationCapIcon className="size-4" />
    </div>
    <div className="leading-tight">
      <div>TLAS.MY</div>
      <div className="font-normal text-muted-foreground text-xs">
        Tuition administration
      </div>
    </div>
  </div>
);
