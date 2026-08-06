import { getMainDomain } from "@repo/auth/domain";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/design-system/components/ui/breadcrumb";
import { Separator } from "@repo/design-system/components/ui/separator";
import { SidebarTrigger } from "@repo/design-system/components/ui/sidebar";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

type BreadcrumbParent =
  | string
  | {
      href: string;
      label: string;
    };

interface HeaderProps {
  children?: ReactNode;
  page: string;
  pages: BreadcrumbParent[];
}

const getMainDomainUrl = () => {
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${getMainDomain()}`;
};

export const Header = ({ pages, page, children }: HeaderProps) => (
  <header className="flex h-16 shrink-0 items-center justify-between gap-2">
    <div className="flex items-center gap-2 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator className="mr-2 h-4" orientation="vertical" />
      <Breadcrumb>
        <BreadcrumbList>
          {pages.map((parent, index) => {
            const breadcrumb =
              typeof parent === "string"
                ? { href: "/", label: parent }
                : parent;

            return (
              <Fragment key={breadcrumb.label}>
                {index > 0 && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Fragment>
            );
          })}
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{page}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
    <div className="flex items-center gap-2 px-4">
      <Link
        className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
        href={`${getMainDomainUrl()}/centres`}
      >
        <ArrowLeftIcon className="size-4" />
        All Centres
      </Link>
      {children}
    </div>
  </header>
);
