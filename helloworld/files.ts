import { Glob } from "bun";

export const NOTES_DIRECTORY = "../notes/";

export async function getFilePaths(): Promise<Array<string>> {
  const glob = new Glob("*.md");

  const filepaths: Array<string> = [];

  for await (const file of glob.scan(NOTES_DIRECTORY)) {
    filepaths.push(`${NOTES_DIRECTORY}${file}`);
  }

  return filepaths;
}

export async function getAsHtml(): Promise<string> {
  const filepaths = await getFilePaths();
  const files = filepaths.map((e) => Bun.file(e));

  const fileContents = await Promise.all(files.map((e) => e.text()));

  const rawBody = fileContents.join("\n---\n");

  return `<!DOCTYPE html>
<html><body><style>* {background-color: black; color: green;}</style><pre>${Bun.escapeHTML(rawBody)}</pre></body></html>`;
}
