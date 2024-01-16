import { IS_PRODUCTON, CERTS_DIR, FQDN } from "./env";
import { join } from "node:path";
import { mainFetchHandler } from "./main";

console.log({ IS_PRODUCTON });

if (!IS_PRODUCTON) {
  console.log("Do not run prod server outside production");
  process.exit(1);
}

const fullchainPath = join(CERTS_DIR, FQDN, `fullchain.pem`);
const keyPath = join(CERTS_DIR, FQDN, `privkey.pem`);

console.log({ fullchainPath, keyPath });
setTimeout(() => {
  Bun.serve({
    hostname: "0.0.0.0",
    port: 443,
    tls: {
      cert: Bun.file(fullchainPath),
      key: Bun.file(keyPath),
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
}, 1000);

console.log("started: " + performance.now());
