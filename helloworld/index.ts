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

const CSS_RESPONSE_BODY = Bun.gzipSync(
  Buffer.from(await Bun.file("./public/main.css").arrayBuffer())
);

const IMAGE = Bun.gzipSync(
  Buffer.from(await Bun.file("./meta.png").arrayBuffer())
);

Bun.serve({
  hostname: "0.0.0.0",
  fetch: async function fetch(req) {
    console.log(req.method, req.url);
    const requestUrl = new URL(req.url);

    console.log(requestUrl);

    if (requestUrl.pathname === "/public/main.css") {
      return new Response(CSS_RESPONSE_BODY, {
        headers: {
          "Content-Encoding": "gzip",
          "Content-type": "text/css; charset=utf-8",
        },
      });
    }

    if (requestUrl.pathname === "/meta.png") {
      return new Response(IMAGE, {
        headers: {
          "Content-Encoding": "gzip",
          "Content-type": "image/png",
          "Cache-Control": "max-age: 31536000, immutable",
        },
      });
    }

    const focusId = requestUrl.pathname.replace(/^\//, "");

    const { html } = await getAsHtml({ focusId });

    const data = Buffer.from(html);
    const HTML_RESPONSE_BODY = Bun.gzipSync(data);

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
