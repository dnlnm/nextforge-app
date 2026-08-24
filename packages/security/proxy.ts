import { defaults, nosecone, type Options, withVercelToolbar } from "@nosecone/next";

/**
 * Create a middleware step that applies Nosecone security headers to a
 * response without discarding it. When given a response (e.g. a redirect from
 * the auth handler) the headers are merged onto it and it is returned as-is,
 * preserving its status and Location. When called with no response it behaves
 * like @nosecone/next's createMiddleware and signals Next.js to continue to
 * the route handler.
 */
export const securityMiddleware =
  (options: Options) =>
  async (response?: Response): Promise<Response> => {
    const headers = nosecone(options);

    if (response) {
      for (const [name, value] of headers) {
        response.headers.set(name, value);
      }

      return response;
    }

    // Standalone mode: setting `x-middleware-next` is how Next.js middleware
    // continues to the route handler while applying the security headers.
    headers.set("x-middleware-next", "1");
    return new Response(null, { headers });
  };

// Nosecone security headers configuration
// https://docs.arcjet.com/nosecone/quick-start
export const noseconeOptions: Options = {
  ...defaults,
  // Cross-Origin-Embedder-Policy is disabled because it blocks cross-origin
  // resources that don't send a `Cross-Origin-Resource-Policy: cross-origin`
  // header, such as images served from Cloudflare R2 object storage.
  crossOriginEmbedderPolicy: false,
  // Content Security Policy (CSP) is disabled by default because the values
  // depend on which Next Forge features are enabled. See
  // https://www.next-forge.com/packages/security/headers for guidance on how
  // to configure it.
  contentSecurityPolicy: false,
};

export const noseconeOptionsWithToolbar: Options =
  withVercelToolbar(noseconeOptions);
