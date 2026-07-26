import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import type { Dictionary } from "@repo/internationalization";
import { Check, MoveRight, PhoneCall } from "lucide-react";
import Link from "next/link";
import { env } from "@/env";

interface PricingProps {
  dictionary: Dictionary;
}

export const Pricing = ({ dictionary }: PricingProps) => (
  <div className="w-full py-20 lg:py-40">
    <div className="container mx-auto">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <Badge>{dictionary.web.home.pricing.badge}</Badge>
        <div className="flex flex-col gap-2">
          <h2 className="max-w-xl text-center font-regular text-3xl tracking-tighter md:text-5xl">
            {dictionary.web.home.pricing.title}
          </h2>
          <p className="max-w-xl text-center text-lg text-muted-foreground leading-relaxed tracking-tight">
            {dictionary.web.home.pricing.description}
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-8 pt-20 text-left lg:grid-cols-3">
          {dictionary.web.home.pricing.plans.map((plan, planIndex) => (
            <Card
              className={
                plan.highlighted
                  ? "w-full rounded-md shadow-2xl"
                  : "w-full rounded-md"
              }
              key={plan.name}
            >
              <CardHeader>
                <CardTitle>
                  <span className="flex flex-row items-center gap-4 font-normal">
                    {plan.name}
                  </span>
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col justify-start gap-8">
                  <p className="flex flex-row items-center gap-2 text-xl">
                    <span className="text-4xl">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">
                      {plan.period}
                    </span>
                  </p>
                  <div className="flex flex-col justify-start gap-4">
                    {plan.features.map((feature) => (
                      <div className="flex flex-row gap-4" key={feature.title}>
                        <Check className="mt-2 h-4 w-4 text-primary" />
                        <div className="flex flex-col">
                          <p>{feature.title}</p>
                          <p className="text-muted-foreground text-sm">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    asChild
                    className="gap-4"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    <Link
                      href={
                        planIndex === 2 ? "/contact" : env.NEXT_PUBLIC_APP_URL
                      }
                    >
                      {plan.cta}{" "}
                      {planIndex === 2 ? (
                        <PhoneCall className="h-4 w-4" />
                      ) : (
                        <MoveRight className="h-4 w-4" />
                      )}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </div>
);
