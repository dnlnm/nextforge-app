import { getDictionary } from "@repo/internationalization";
import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { Pricing } from "../(home)/components/pricing";

interface PricingPageProps {
  readonly params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: PricingPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return createMetadata({
    description: dictionary.web.home.pricing.description,
    title: `${dictionary.web.home.pricing.title} - TLAS.MY`,
  });
};

const PricingPage = async ({ params }: PricingPageProps) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return <Pricing dictionary={dictionary} locale={locale} />;
};

export default PricingPage;
