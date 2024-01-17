import "./logger";
import { IS_PRODUCTION, CERTS_DIR, FQDN } from "./env";
import { join } from "node:path";
import { mainFetchHandler } from "./main";

logger.debug("PRODUCTION_MODE", { IS_PRODUCTION });

if (!IS_PRODUCTION) {
  logger.error("Do not run prod server outside production");
  process.exit(1);
}

const fullchainPath = join(CERTS_DIR, FQDN, `fullchain1.pem`);
const keyPath = join(CERTS_DIR, FQDN, `privkey1.pem`);

logger.debug("CERT_PATHS", { fullchainPath, keyPath });
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

logger.info("Server Started", { timestamp: Date.now() });
