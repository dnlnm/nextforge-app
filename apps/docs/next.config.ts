import "@repo/config/load-env";
import { createMDX } from "fumadocs-mdx/next";
import { config } from "@repo/next-config";

const withMDX = createMDX();

export default withMDX(config);
