import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/design-system/components/ui/accordion";
import { Button } from "@repo/design-system/components/ui/button";
import type { Dictionary } from "@repo/internationalization";
import { localizePath } from "@repo/internationalization";
import { PhoneCall } from "lucide-react";
import Link from "next/link";

interface FAQProps {
  dictionary: Dictionary;
  locale: string;
}

export const FAQ = ({ dictionary, locale }: FAQProps) => (
  <div className="w-full scroll-mt-24 border-t py-20 lg:py-28" id="faq">
    <div className="container mx-auto">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-col gap-3">
            <span className="w-fit rounded-full border bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">FAQ</span>
            <h4 className="max-w-[14ch] text-left font-heading text-3xl leading-none tracking-[-0.03em] text-balance md:text-[2.5rem]">
              {dictionary.web.home.faq.title}
            </h4>
            <p className="max-w-[34ch] text-left text-[15px] leading-relaxed text-muted-foreground text-pretty">
              {dictionary.web.home.faq.description}
            </p>
          </div>
          <Button
            className="w-fit gap-2"
            variant="outline"
            render={<Link href={localizePath(locale, "/contact")} />}
          >
            {dictionary.web.home.faq.cta} <PhoneCall className="h-4 w-4" />
          </Button>
        </div>
        <Accordion className="w-full rounded-2xl border bg-card p-2 shadow-sm md:p-6">
          {dictionary.web.home.faq.items.map((item) => (
            <AccordionItem key={item.question} value={item.question} className="border-b last:border-0">
              <AccordionTrigger className="text-left text-[15px] font-medium hover:no-underline">{item.question}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground text-pretty">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  </div>
);
