import { getFilePaths, NOTES_DIRECTORY } from './files'

test('it should read the files', async () => {
    const result = await getFilePaths()
    expect(Array.isArray(result)).toBe(true)
    expect(result.some(e => !e.startsWith(NOTES_DIRECTORY))).toBe(false)
})