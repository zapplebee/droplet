import type { Logger } from "winston";
import { createLogger, transports, format } from "winston";

export const logger = createLogger({
  level: "debug",
  format: format.json(),
  defaultMeta: { service: "helloworld" },
  transports: [new transports.Console()],
});

declare global {
  var logger: Logger;
}

globalThis.logger = logger;
