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

  let inCodeBlock = false;

  return `<!DOCTYPE html>
<html><head></head><body><style>@import "/public/main.css";</style><main>${bodyLines
    .map((line, index) => {
      const linkedLine = line.replaceAll(
        /(https:\/\/[^\s\)]+)/gi,
        '<a href="$&">$&</a>'
      );
      const lineNumber = String(index).padStart(maxCharactersInLineNumber, "0");
      const lineId = `line-${lineNumber}`;

      const isBackticks = line.startsWith("```");

      let addOpenTag = false;
      let addCloseTag = false;

      if (isBackticks && !inCodeBlock) {
        addOpenTag = true;
      }

      if (isBackticks) {
        inCodeBlock = !inCodeBlock;
      }

      if (!inCodeBlock && isBackticks) {
        addCloseTag = true;
      }

      const inCode = Boolean(inCodeBlock || isBackticks);

      const openTag = addOpenTag
        ? `<div class="codeblock-container"><div class="codeblock-wrapper">`
        : "";
      const closeTag = addCloseTag ? `</div></div>` : "";

      return `${openTag}<div class="line" id="${lineId}"><a class="line-link" href="#${lineId}">${lineNumber}</a><span class="${inCode ? "codeblock" : "prose"}">${inCode ? line : linkedLine}</span></div>${closeTag}`;
    })
    .join("\n")}</main></body></html>`;
}
