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
  <div className="w-full scroll-mt-24 py-20 lg:py-40" id="faq">
    <div className="container mx-auto">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h4 className="max-w-xl text-left font-regular text-3xl tracking-tighter md:text-5xl">
                {dictionary.web.home.faq.title}
              </h4>
              <p className="max-w-xl text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-lg">
                {dictionary.web.home.faq.description}
              </p>
            </div>
            <div className="">
              <Button asChild className="gap-4" variant="outline">
                <Link href={localizePath(locale, "/contact")}>
                  {dictionary.web.home.faq.cta}{" "}
                  <PhoneCall className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <Accordion className="w-full" collapsible type="single">
          {dictionary.web.home.faq.items.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  </div>
);
