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

  const headTags = `
<title>zapplebee.prettybirdserver.com</title>
<meta name="viewport" content="width=400px, initial-scale=1" />
<meta name="description" content="Zac Skalko's Log, desc">
<meta property="og:title" content="Zac Skalko's Log">
<meta property="og:type" content="article" />
<meta property="og:url" content="https://zapplebee.prettybirdserver.com">
<meta property="og:description" content="A full log of Zac's fun little computer project, og:desc">
<meta property="og:site_name" content="zapplebee.prettybirdserver.com">
<meta name="twitter:site" content="@zapplebee">
<style>@import "/public/main.css";</style>
`;

  const head = `<!DOCTYPE html>
<html lang="en"><head>${headTags}</head><body><main>`;

  const tail = `</main></body></html>`;

  const main = bodyLines
    .map((line, index) => {
      const lineNumber = String(index).padStart(maxCharactersInLineNumber, "0");
      const lineId = `line-${lineNumber}`;

      const isBackticks = line.startsWith("```");

      let addCodeBlockOpenTag = false;
      let addCodeBlockCloseTag = false;

      if (isBackticks && !inCodeBlock) {
        addCodeBlockOpenTag = true;
      }

      if (isBackticks) {
        inCodeBlock = !inCodeBlock;
      }

      if (!inCodeBlock && isBackticks) {
        addCodeBlockCloseTag = true;
      }

      const inCode = Boolean(inCodeBlock || isBackticks);

      const lineText = inCode
        ? line
        : line.replaceAll(/(https:\/\/[^\s\)]+)/gi, '<a href="$&">$&</a>');

      const containerOpenTag = addCodeBlockOpenTag
        ? `<div class="codeblock-container"><div class="codeblock-wrapper">`
        : "";

      const openingLineTag = `<div class="line" id="${lineId}">`;
      const lineIdxElement = `<a class="line-link" href="#${lineId}">${lineNumber}</a>`;
      const lineStrElement = `<span class="${inCode ? "codeblock" : "prose"}">${lineText}</span>`;
      const closingLineTag = `</div>`;
      const containerCloseTag = addCodeBlockCloseTag ? `</div></div>` : "";

      return [
        containerOpenTag,
        openingLineTag,
        lineIdxElement,
        lineStrElement,
        closingLineTag,
        containerCloseTag,
      ].join("");
    })
    .join("");

  return [head, main, tail].join("");
}
