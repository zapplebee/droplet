import { getAsHtml } from "./files" with { type: "macro" };

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

const HTML_CONTENT = await getAsHtml();

Bun.serve({
  hostname: "0.0.0.0",
  fetch(req) {
    return new Response(HTML_CONTENT, {
      headers: {
        "Content-type": "text/html; charset=utf-8",
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
