"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Calendar } from "@repo/design-system/components/ui/calendar";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { cn } from "@repo/design-system/lib/utils";
import { formatLongDate } from "@repo/date";
import type { Dictionary } from "@repo/internationalization";
import { CalendarIcon, Check, MoveRight } from "lucide-react";
import { useState } from "react";

interface ContactFormProps {
  dictionary: Dictionary;
  locale: string;
}

export const ContactForm = ({ dictionary, locale }: ContactFormProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="w-full py-16 lg:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h4 className="max-w-[16ch] text-left font-heading text-3xl leading-none tracking-[-0.03em] text-balance md:text-5xl">
                {dictionary.web.contact.meta.title}
              </h4>
              <p className="max-w-[38ch] text-left text-[15px] leading-relaxed text-muted-foreground text-pretty">
                {dictionary.web.contact.meta.description}
              </p>
            </div>
            <div className="flex flex-col gap-6">
            {dictionary.web.contact.hero.benefits.map((benefit) => (
              <div
                className="flex flex-row items-start gap-3 text-left"
                key={benefit.title}
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border">
                  <Check className="h-3 w-3 text-primary" />
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{benefit.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
            </div>
          </div>

          <div className="flex items-start justify-center lg:justify-end">
            <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border bg-card p-6 shadow-md md:p-8">
              <p className="text-sm font-semibold tracking-tight">{dictionary.web.contact.hero.form.title}</p>
              <div className="grid w-full max-w-sm items-center gap-1">
                <Label htmlFor="picture">
                  {dictionary.web.contact.hero.form.date}
                </Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        className={cn(
                          "w-full max-w-sm justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                        variant="outline"
                      />
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      formatLongDate(date, locale)
                    ) : (
                      <span>{dictionary.web.contact.hero.form.date}</span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      onSelect={setDate}
                      selected={date}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid w-full max-w-sm items-center gap-1">
                <Label htmlFor="firstname">
                  {dictionary.web.contact.hero.form.firstName}
                </Label>
                <Input id="firstname" type="text" />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1">
                <Label htmlFor="lastname">
                  {dictionary.web.contact.hero.form.lastName}
                </Label>
                <Input id="lastname" type="text" />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1">
                <Label htmlFor="picture">
                  {dictionary.web.contact.hero.form.resume}
                </Label>
                <Input id="picture" type="file" />
              </div>

              <Button className="w-full gap-4" type="submit">
                {dictionary.web.contact.hero.form.cta}{" "}
                <MoveRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
