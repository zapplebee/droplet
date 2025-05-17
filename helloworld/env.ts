import pkg from "./package.json";
export const VERSION: string = pkg.version;
export const FQDN: string = process.env.DOMAIN ?? "zapplebee.online";
export const NOTES_DIR: string =
  process.env.NOTES_DIR ?? "/mnt/volume_sfo3_01/apps/notes";

type LogLevel = "DEBUG" | "INFO";
export const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL ??
  "DEBUG") as LogLevel;

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
