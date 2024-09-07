import { Hono } from "hono";
import type { FC } from "hono/jsx";
import { serveStatic } from "hono/bun";
import EventEmitter from "node:events";
import { unlinkSync } from "node:fs";
import { JSONFilePreset } from "lowdb/node";

import sharp from "sharp";
import { randomUUID } from "node:crypto";
import path from "node:path";
const app = new Hono();

const uploadEmitter = new EventEmitter();

type AssetInstance = {
  url: string;
  width: number;
  height: number;
  format: string;
};

type Asset = {
  instances: Array<AssetInstance>;
  metadata: Record<string, string>;
};

type ImageRecord = { images: Record<string, Asset> };

const defaultData: ImageRecord = { images: {} };
//@ts-ignore
const db = await JSONFilePreset<ImageRecord>("images.json", defaultData);

uploadEmitter.on("upload", async ({ quarantineFilePath, id }) => {
  try {
    const upload = sharp(quarantineFilePath);
    const metadata = await upload.metadata();
    const formats = ["jpg", "png", "avif", "webp"] as const;
    const sizes = new Set([200, 500, 1000, 2000, metadata.width as number]);

    for (const format of formats) {
      for (const size of sizes) {
        try {
          if ((metadata.width as number) < size) {
            continue;
          }

          const sizeLabel = size === metadata.width ? "og" : size;

          const url = `/uploads/${id}_${sizeLabel}.${format}`;

          const instance = await upload
            .clone()
            .resize({ width: size })
            .toFormat(format)
            .toFile(`.${url}`);

          await db.update(({ images }) => {
            images[id].instances.push({
              url,
              width: instance.width,
              height: instance.height,
              format: instance.format,
            });
          });
        } catch (err) {
          console.log(err);
        } finally {
          await db.write();
        }
      }
    }
  } catch (err) {
    console.log(err);
  } finally {
    unlinkSync(quarantineFilePath);
  }
});

app.use("/uploads/*", serveStatic({ root: "./" }));

const Layout: FC = (props) => {
  return (
    <html>
      <body>{props.children}</body>
      <h1>Upload an Image</h1>
      <form action="" method="post" enctype="multipart/form-data">
        <label for="pic">Choose an image:</label>
        <input type="file" id="pic" name="pic" accept="image/*" required />
        <button type="submit">Upload</button>
      </form>
    </html>
  );
};

app.get("/", (c) => {
  return c.html(<Layout />);
});

app.post("/", async (c) => {
  const id = randomUUID();

  try {
    const formData = await c.req.parseBody();

    const file: File = formData.pic as File;

    if (file) {
      const quarantineFolder = "./quarantine";
      const quarantineFilePath = path.join(quarantineFolder, id);

      const fileBlob = new Blob([await file.arrayBuffer()]);

      await Bun.write(quarantineFilePath, fileBlob);

      await db.update(({ images }) => {
        images[id] = {
          instances: [],
          metadata: { originalName: file.name },
        };
      });

      await db.write();

      uploadEmitter.emit("upload", {
        quarantineFilePath,
        id,
        name: file.name,
      });
      return c.redirect(`/?result=success&id=${id}`);
    } else {
      throw new Error("No pic attached");
    }
  } catch (err) {
    console.log(err);
    return c.redirect(`/?r=result&id=${id}`);
  }
});

export default app;
