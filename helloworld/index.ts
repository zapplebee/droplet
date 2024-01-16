import { IS_PRODUCTON, CERTS_DIR, FQDN } from "./env";
import { join } from "node:path";
import { mainFetchHandler } from "./main";

const PRODUCTION_CONFIG = {
  port: 443,
  tls: {
    cert: Bun.file(join(CERTS_DIR, FQDN, `fullchain.pem`)),
    key: Bun.file(join(CERTS_DIR, FQDN, `privkey.pem`)),
  },
} as const;

const DEV_CONFIG = {
  port: 3100,
} as const;

console.log({ IS_PRODUCTON });
const LIVE_CONFIG = IS_PRODUCTON ? PRODUCTION_CONFIG : DEV_CONFIG;

Bun.serve({
  hostname: "0.0.0.0",
  fetch(req: Request) {
    return mainFetchHandler(req);
  },
  ...LIVE_CONFIG,
} as any);

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
