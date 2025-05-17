import "./logger";
import { IS_PRODUCTION } from "./env";
import { mainFetchHandler } from "./main";

logger.debug("PRODUCTION_MODE", { IS_PRODUCTION });

const APP_PORT = 3000;

Bun.serve({
  hostname: "0.0.0.0",
  port: APP_PORT,
  fetch: mainFetchHandler,
});

logger.info("Server Started", {
  timestamp: Date.now(),
  port: APP_PORT,
});
