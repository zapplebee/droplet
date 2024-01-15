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

  const description = "Zac's Log";
  const title = "Zac's Log";
  const canonicalURL = "https://zapplebee.prettybirdserver.com";
  const headTags = `
<meta charset="utf-8" />
<meta name="viewport" content="width=400px, initial-scale=1" />
<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}" />
<meta name="description" content="${description}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${canonicalURL}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<!-- <meta property="og:image" content="NONE_SET" /> -->

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="${canonicalURL}" />
<meta property="twitter:title" content="${title}" />
<meta property="twitter:description" content="${description}" />
<!--  <meta property="twitter:image" content="NONE_SET" /> -->

<!-- Mastodon -->
<link href="https://mastodon.cloud/@zapplebee" rel="me" />
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
