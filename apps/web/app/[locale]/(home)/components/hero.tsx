"use client";

import { Button } from "@repo/design-system/components/ui/button";
import type { Dictionary } from "@repo/internationalization";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { env } from "@/env";

interface HeroProps {
  dictionary: Dictionary;
}

export const Hero = ({ dictionary }: HeroProps) => {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = dictionary.web.home.hero.words;
  const titleCount = titles.length;

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTitleNumber((current) =>
        current === titleCount - 1 ? 0 : current + 1
      );
    }, 2000);

    return () => clearInterval(intervalId);
  }, [titleCount]);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center gap-8 py-20 lg:py-32">
          <div>
            <Button asChild className="gap-4" size="sm" variant="secondary">
              <Link href="/blog">
                {dictionary.web.home.hero.announcement}{" "}
                <MoveRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="max-w-4xl text-center font-regular text-5xl tracking-tighter md:text-7xl">
              <span>{dictionary.web.home.meta.title}</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pt-1 md:pb-4">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    animate={
                      titleNumber === index
                        ? { opacity: 1, y: 0 }
                        : {
                            opacity: 0,
                            y: titleNumber > index ? -150 : 150,
                          }
                    }
                    className="absolute font-semibold text-primary"
                    initial={{ opacity: 0, y: -100 }}
                    key={title}
                    transition={{ stiffness: 50, type: "spring" }}
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>
            <p className="max-w-2xl text-center text-lg text-muted-foreground leading-relaxed tracking-tight md:text-xl">
              {dictionary.web.home.meta.description}
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <Button asChild className="gap-4" size="lg" variant="outline">
              <Link href="/contact">
                {dictionary.web.global.primaryCta}{" "}
                <PhoneCall className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="gap-4" size="lg">
              <Link href={env.NEXT_PUBLIC_APP_URL}>
                {dictionary.web.global.secondaryCta}{" "}
                <MoveRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
