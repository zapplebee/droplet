import { getAsHtml } from "./files";

const PRODUCTION_CONFIG = {
  port: 443,
  tls: {
    cert: Bun.file(
      "/etc/letsencrypt/live/zapplebee.prettybirdserver.com/cert.pem"
    ),
    key: Bun.file(
      "/etc/letsencrypt/live/zapplebee.prettybirdserver.com/privkey.pem"
    ),
  },
} as const;

const DEV_CONFIG = {
  port: 3100,
} as const;

const IS_PRODUCTON = process.env.NODE_ENV === "production";

const LIVE_CONFIG = IS_PRODUCTON ? PRODUCTION_CONFIG : DEV_CONFIG;

const CSS_RESPONSE_BODY = Buffer.from(
  await Bun.file("./public/main.css").arrayBuffer()
);

const IMAGE = Buffer.from(await Bun.file("./meta.png").arrayBuffer());

Bun.serve({
  hostname: "0.0.0.0",
  fetch: async function fetch(req) {
    console.log(
      req.method,
      req.url,
      req.headers.get("User-Agent") ?? "NO_USER_AGENT"
    );
    const requestUrl = new URL(req.url);

    const acceptsGzip = req.headers.get("Content-Encoding")?.includes("gzip");

    const { compress, encodingHeaders } = acceptsGzip
      ? {
          compress: Bun.gzipSync,
          encodingHeaders: { "Content-Encoding": "gzip" },
        }
      : { compress: (e: any) => e, encodingHeaders: {} };

    console.log(requestUrl);

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
  },
  ...LIVE_CONFIG,
});

if (IS_PRODUCTON) {
  // no need to serve the redirects if we're not in prod
  Bun.serve({
    port: 80,
    hostname: "0.0.0.0",
    fetch(req) {
      return Response.redirect(`${req.url.replace(/^http:/gi, "https:")}`, 302);
    },
  });
}

console.log("started: " + performance.now());
