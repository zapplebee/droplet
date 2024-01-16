import { IS_PRODUCTON, CERTS_DIR, FQDN } from "./env";
import { join } from "node:path";
import { mainFetchHandler } from "./main";

console.log({ IS_PRODUCTON });

if (!IS_PRODUCTON) {
  console.log("Do not run prod server outside production");
  process.exit(1);
}

Bun.serve({
  hostname: "0.0.0.0",
  port: 443,
  tls: {
    cert: Bun.file(join(CERTS_DIR, FQDN, `fullchain.pem`)),
    key: Bun.file(join(CERTS_DIR, FQDN, `privkey.pem`)),
  },
  fetch: mainFetchHandler,
});

Bun.serve({
  port: 80,
  hostname: "0.0.0.0",
  fetch(req) {
    return Response.redirect(`${req.url.replace(/^http:/gi, "https:")}`, 302);
  },
});

console.log("started: " + performance.now());
