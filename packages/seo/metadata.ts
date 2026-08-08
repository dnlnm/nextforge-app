import { appName } from "@repo/config/brand";
import merge from "lodash.merge";
import type { Metadata } from "next";

type MetadataGenerator = Omit<Metadata, "description" | "title"> & {
  title: string;
  description: string;
  image?: string;
};

const applicationName = appName;
const author: Metadata["authors"] = {
  name: appName,
};
const publisher = appName;
const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const protocolPattern = /^https?:\/\//;

const getMetadataBase = (): URL | undefined => {
  if (!productionUrl) {
    return undefined;
  }

  return new URL(
    protocolPattern.test(productionUrl)
      ? productionUrl
      : `${process.env.NODE_ENV === "production" ? "https" : "http"}://${productionUrl}`
  );
};

export const createMetadata = ({
  title,
  description,
  image,
  ...properties
}: MetadataGenerator): Metadata => {
  const parsedTitle = `${title} | ${applicationName}`;
  const defaultMetadata: Metadata = {
    title: parsedTitle,
    description,
    applicationName,
    metadataBase: getMetadataBase(),
    authors: [author],
    creator: author.name,
    formatDetection: {
      telephone: false,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: parsedTitle,
    },
    openGraph: {
      title: parsedTitle,
      description,
      type: "website",
      siteName: applicationName,
      locale: "en_US",
    },
    publisher,
    twitter: {
      card: "summary_large_image",
    },
  };

  const metadata: Metadata = merge(defaultMetadata, properties);

  if (image && metadata.openGraph) {
    metadata.openGraph.images = [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: title,
      },
    ];
  }

  return metadata;
};
