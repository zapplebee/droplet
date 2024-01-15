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

export type GetAsHtmlProps = {
  focusId?: string;
};

type GetAsHtmlResult = {
  focusIdExists: boolean;
  html: string;
};

export async function getAsHtml(
  { focusId }: GetAsHtmlProps = { focusId: undefined }
): Promise<GetAsHtmlResult> {
  const ids: Set<string> = new Set([]);
  const filepaths = await getFilePaths();
  const files = filepaths.map((e) => Bun.file(e));
  const fileContents = await Promise.all(files.map((e) => e.text()));
  const rawBody = fileContents.join("\n---\n").replaceAll("\r", "");
  const rawBodyLines = rawBody.split("\n");
  const bodyLines = rawBodyLines.map((e) => Bun.escapeHTML(e));
  const maxCharactersInLineNumber = String(bodyLines.length).length;

  let inCodeBlock = false;

  const description = "Zac's Log";
  const title = "Zac's Log";
  const canonicalURL = "https://zapplebee.online";
  const metaImage = "https://zapplebee.online/meta.png";
  const headTags = `
<meta charset="utf-8" />
<link rel="icon" type="image/png" href="${metaImage}" />
<meta name="viewport" content="width=400, initial-scale=1" />
<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}" />
<meta name="description" content="${description}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${canonicalURL}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${metaImage}" />

<!-- Twitter -->
<meta property="twitter:card" content="summary" />
<meta property="twitter:url" content="${canonicalURL}" />
<meta property="twitter:title" content="${title}" />
<meta property="twitter:description" content="${description}" />
<meta property="twitter:image" content="${metaImage}" />

<!-- Mastodon -->
<link href="https://mastodon.cloud/@zapplebee" rel="me" />
<style>@import "/public/main.css";</style>
`;

  const head = `<!DOCTYPE html>
<html lang="en">
<head>
${headTags}
</head>
<body>
<main>`;

  const main = bodyLines
    .map((line, index) => {
      const rawLine = rawBodyLines[index];
      const lineNumber = String(index).padStart(maxCharactersInLineNumber, "0");
      const lineId = `line-${index}`;

      ids.add(lineId);

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

      const isPostStart = !inCodeBlock && rawLine.startsWith("<POST");

      const isPostEnd = !inCodeBlock && rawLine.startsWith("</POST>");

      let slug = null;

      let lineText = inCode
        ? line
        : line.replaceAll(/(https:\/\/[^\s\)]+)/gi, '<a href="$&">$&</a>');

      if (isPostStart) {
        const slugRegex = /(.+slug=")([^"]+)(".+)/;
        slug = rawLine.replace(slugRegex, "$2");

        ids.add(slug);
        lineText = lineText.replace(slug, `<a href="/${slug}">${slug}</a>`);
      }

      const lineClass = inCode ? "codeblock" : "prose";

      const postOpenTag = slug
        ? `<div class="post-container" id="${slug}"><div class="post-wrapper">`
        : "";

      const containerOpenTag = addCodeBlockOpenTag
        ? `<div class="codeblock-container"><div class="codeblock-wrapper">`
        : "";

      const openingLineTag = `<div class="line" id="${lineId}">`;
      const lineIdxElement = `<a class="line-link" href="/${lineId}">${lineNumber}</a>`;
      const lineStrElement = `<span class="${lineClass}">${lineText}</span>`;
      const closingLineTag = `</div>`;
      const containerCloseTag = addCodeBlockCloseTag ? `</div></div>` : "";
      const postCloseTag = isPostEnd ? `</div></div>` : "";

      return [
        postOpenTag,
        containerOpenTag,
        openingLineTag,
        lineIdxElement,
        lineStrElement,
        closingLineTag,
        containerCloseTag,
        postCloseTag,
      ].join("");
    })
    .join("");

  let scrollToScript = "";
  if (focusId && ids.has(focusId)) {
    scrollToScript = `<script>window['${focusId}'].scrollIntoView(true);</script>`;
  }

  const tail = `</main>${scrollToScript}</body></html>`;

  return {
    html: [head, main, tail].join(""),
    focusIdExists: focusId === undefined || ids.has(focusId),
  };
}
