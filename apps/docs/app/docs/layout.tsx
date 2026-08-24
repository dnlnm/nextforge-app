import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

interface DocsLayoutProperties {
  readonly children: ReactNode;
}

const DocsLayoutPage = ({ children }: DocsLayoutProperties) => (
  <DocsLayout {...baseOptions} tree={source.getPageTree()}>
    {children}
  </DocsLayout>
);

export default DocsLayoutPage;
