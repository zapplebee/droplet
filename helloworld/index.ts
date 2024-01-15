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

const data = Buffer.from(HTML_CONTENT);
const HTML_RESPONSE_BODY = Bun.gzipSync(data);

const CSS_RESPONSE_BODY = Bun.gzipSync(
  Buffer.from(await Bun.file("./public/main.css").arrayBuffer())
);

Bun.serve({
  hostname: "0.0.0.0",
  fetch: async function fetch(req) {
    console.log(req.method, req.url);
    const requestUrl = new URL(req.url);

    const cssRequestPath = new URL("/public/main.css", requestUrl.origin);

    if (requestUrl.pathname === "/public/main.css") {
      return new Response(CSS_RESPONSE_BODY, {
        headers: {
          "Content-Encoding": "gzip",
          "Content-type": "text/css; charset=utf-8",
        },
      });
    }

    return new Response(HTML_RESPONSE_BODY, {
      headers: {
        "Content-Encoding": "gzip",
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
