import { IS_PRODUCTON } from "./env";
import { mainFetchHandler } from "./main";

if (IS_PRODUCTON) {
  console.log("Do not run dev server in production");
  process.exit(1);
}

Bun.serve({
  port: 80,
  hostname: "0.0.0.0",
  fetch: mainFetchHandler,
});
