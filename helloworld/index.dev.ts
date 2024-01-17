import "./logger";
import { IS_PRODUCTION } from "./env";
import { mainFetchHandler } from "./main";

if (IS_PRODUCTION) {
  logger.error("Do not run dev server in production");
  process.exit(1);
} else {
  logger.info("Running dev server", { url: "http://0.0.0.0:3100" });
}

Bun.serve({
  port: 3100,
  hostname: "0.0.0.0",
  fetch: mainFetchHandler,
});
