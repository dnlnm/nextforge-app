import { DocsBody, DocsPage } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { source } from "@/lib/source";

interface PageProperties {
  readonly params: Promise<{
    readonly slug?: string[];
  }>;
}

const DocsPageRoute = async ({ params }: PageProperties) => {
  const { slug = [] } = await params;
  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsBody>
        <MDX />
      </DocsBody>
    </DocsPage>
  );
};

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: PageProperties) {
  const { slug = [] } = await params;
  const page = source.getPage(slug);

  if (!page) {
    return {};
  }

  return {
    title: page.data.title,
    description: page.data.description,
  };
}

export default DocsPageRoute;
