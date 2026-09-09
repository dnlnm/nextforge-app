import { Button } from "@repo/design-system/components/ui/fluid-button";
import {
  Card,
  CardContent,
} from "@repo/design-system/components/ui/fluid-card";
import {
  BookOpenIcon,
  GlobeIcon,
  PlusCircleIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

export const CentreEmptyState = () => {
  const steps = [
    {
      step: "01",
      title: "Workspace & Subdomain",
      description:
        "Claim your unique centre name and dedicated web address (e.g. brightmind.klio.my).",
      icon: <GlobeIcon className="size-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      step: "02",
      title: "Academics & Teaching Staff",
      description:
        "Set up subjects, academic levels, rooms, and invite teachers to their daily roster.",
      icon: (
        <BookOpenIcon className="size-5 text-indigo-600 dark:text-indigo-400" />
      ),
    },
    {
      step: "03",
      title: "Students & Fee Collection",
      description:
        "Import student records from Excel, record attendance, and generate monthly fee invoices.",
      icon: (
        <UsersIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
      ),
    },
  ];

  return (
    <Card className="overflow-hidden border-border/80 p-6 shadow-xs sm:p-10">
      <CardContent className="flex flex-col items-center p-0 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <SparklesIcon className="size-7" />
        </div>

        <h2 className="font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
          Welcome to KLIO.MY
        </h2>
        <p className="mt-2 max-w-xl text-muted-foreground text-sm sm:text-base">
          One calm, centralized place to manage your Malaysian tuition centre.
          Replace disconnected spreadsheets with a single system for students,
          attendance, and fees.
        </p>

        {/* 3-step feature preview */}
        <div className="my-8 grid w-full max-w-4xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
          {steps.map((item) => (
            <div
              className="rounded-xl border border-border/60 bg-surface-1 p-5 shadow-xs transition-colors hover:border-primary/30"
              key={item.step}
            >
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-background ring-1 ring-border/50">
                  {item.icon}
                </div>
                <span className="font-mono font-semibold text-muted-foreground/60 text-xs">
                  {item.step}
                </span>
              </div>
              <h3 className="mt-3.5 font-semibold text-base text-foreground">
                {item.title}
              </h3>
              <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <Button
          asChild
          className="gap-2 px-8 font-medium shadow-sm"
          size="default"
        >
          <Link href="/center-setup">
            <PlusCircleIcon className="size-4" />
            Set Up Your Tuition Centre
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
