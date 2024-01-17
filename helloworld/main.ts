import type { Server } from "bun";
import { getAsHtml } from "./files";

const CSS_RESPONSE_BODY = Buffer.from(
  await Bun.file("./public/main.css").arrayBuffer()
);

const IMAGE = Buffer.from(await Bun.file("./meta.png").arrayBuffer());

export async function mainFetchHandler(req: Request, server: Server) {
  const requestUrl = new URL(req.url);

  logger.http(`${req.method}: ${requestUrl.pathname}`, {
    hostname: requestUrl.hostname,
    pathname: requestUrl.pathname,
    search: requestUrl.search,
    userAgent: req.headers.get("User-Agent") ?? "NO_USER_AGENT",
    timestamp: Date.now(),
    ipAddress: server.requestIP(req),
    method: req.method,
  });

  const acceptsGzip = req.headers.get("Accept-Encoding")?.includes("gzip");

  const { compress, encodingHeaders } = acceptsGzip
    ? {
        compress: Bun.gzipSync,
        encodingHeaders: { "Content-Encoding": "gzip" },
      }
    : { compress: (e: any) => e, encodingHeaders: {} };

  if (requestUrl.pathname === "/public/main.css") {
    return new Response(compress(CSS_RESPONSE_BODY), {
      headers: {
        ...encodingHeaders,
        "Content-type": "text/css; charset=utf-8",
      },
    });
  }

  if (requestUrl.pathname === "/robots.txt") {
    return new Response(compress(Buffer.from("User-agent: *\nDisallow:\n")), {
      headers: {
        ...encodingHeaders,
        "Content-type": "text/plain",
        "Cache-Control": "max-age: 31536000, immutable",
      },
    });
  }

  if (requestUrl.pathname === "/meta.png") {
    return new Response(compress(IMAGE), {
      headers: {
        ...encodingHeaders,
        "Content-type": "image/png",
        "Cache-Control": "max-age: 31536000, immutable",
      },
    });
  }

  const focusId = requestUrl.pathname.replace(/^\//, "");

  const { html } = await getAsHtml({ focusId });

  const data = Buffer.from(html);

  return new Response(compress(data), {
    headers: {
      ...encodingHeaders,
      "Content-type": "text/html; charset=utf-8",
      Link: `</public/main.css>; rel="prefetch"; as="style";`,
    },
  });
}
