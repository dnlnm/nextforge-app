import { legal } from "@repo/cms";
import { appName } from "@repo/config/brand";
import { localizePath } from "@repo/internationalization";
import { Status } from "@repo/observability/status";
import Link from "next/link";
import { env } from "@/env";

interface FooterProps {
  locale: string;
}

export const Footer = async ({ locale }: FooterProps) => {
  const legalPages = await legal.getPostsMeta();

  const navigationItems = [
    {
      title: "Home",
      href: localizePath(locale, "/"),
      description: "",
    },
    {
      title: "Pages",
      description: "Tuition centre operations, billing, and reporting.",
      items: [
        {
          title: "Blog",
          href: localizePath(locale, "/blog"),
        },
      ],
    },
    {
      title: "Legal",
      description: `Terms for ${appName} subscription and data handling.`,
      items: [
        { title: "Privacy", href: localizePath(locale, "/privacy") },
        { title: "Terms", href: localizePath(locale, "/terms") },
        ...legalPages.map((post) => ({
          title: post._title,
          href: localizePath(locale, `/legal/${post._slug}`),
        })),
      ],
    },
  ];

  if (env.NEXT_PUBLIC_DOCS_URL) {
    navigationItems.at(1)?.items?.push({
      title: "Docs",
      href: env.NEXT_PUBLIC_DOCS_URL,
    });
  }

  return (
    <section className="dark border-foreground/10 border-t">
      <div className="w-full bg-background py-16 text-foreground lg:py-24">
        <div className="container mx-auto">
          <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_1.4fr]">
            <div className="flex flex-col items-start gap-5">
              <div className="flex flex-col gap-2">
                <h2 className="text-left font-brand text-2xl tracking-tight">
                  {appName}
                </h2>
                <p className="max-w-[32ch] text-left text-sm leading-relaxed text-foreground/70 text-pretty">
                  Tuition centre management for Malaysian owners, admins, and
                  teachers. Attendance, invoices, and reports — without the
                  spreadsheet drift.
                </p>
              </div>
              <Status />
            </div>
            <div className="grid items-start gap-10 sm:grid-cols-3">
              {navigationItems.map((item) => (
                <div
                  className="flex flex-col items-start gap-3 text-sm"
                  key={item.title}
                >
                  <div className="flex flex-col gap-3">
                    {item.href ? (
                      <Link
                        className="text-sm font-semibold tracking-tight hover:underline"
                        href={item.href}
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/60">{item.title}</p>
                    )}
                    <div className="flex flex-col gap-2">
                    {item.items?.map((subItem) => (
                      <Link
                        className="text-sm text-foreground/70 transition-colors hover:text-foreground"
                        href={subItem.href}
                        key={subItem.title}
                        rel={
                          subItem.href.includes("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                        target={
                          subItem.href.includes("http") ? "_blank" : undefined
                        }
                      >
                        {subItem.title}
                      </Link>
                    ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
