import { Glob } from "bun";

export const NOTES_DIRECTORY = "/mnt/volume_sfo3_01/apps/notes/"

export async function getFilePaths(): Promise<Array<string>> {

    const glob = new Glob("*.md");
    
    const filepaths: Array<string> = []

    for await (const file of glob.scan(NOTES_DIRECTORY)) {
      filepaths.push(`${NOTES_DIRECTORY}${file}`)
    }

    return filepaths;
}