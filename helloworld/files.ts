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
  const rawBody = fileContents.join("\n---\n").replaceAll("\r", "");
  const escapedBody = Bun.escapeHTML(rawBody);
  const bodyLines = escapedBody.split("\n");
  const maxCharactersInLineNumber = String(bodyLines.length).length;

  return `<!DOCTYPE html>
<html><body><style>* {background-color: black; color: #4d9c25;} .line-link {color: #2f5c19;} .space, .line-link {  -webkit-user-select: none; -ms-user-select: none; user-select: none;}</style><pre>${bodyLines
    .map((line, index) => {
      const lineNumber = String(index).padStart(maxCharactersInLineNumber, "0");
      const lineId = `line-${lineNumber}`;

      return `<span class="line" id="${lineId}"><a class="line-link" href="#${lineId}">${lineNumber}</a><span class="space">&nbsp;&nbsp;&nbsp;&nbsp;</span><span>${line}</span></span>`;
    })
    .join("\n")}</pre></body></html>`;
}
