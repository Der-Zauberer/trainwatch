import FileSystem from 'node:fs'
import Path from 'path'

export function readFile(name: string): string {
    if (!FileSystem.existsSync(name)) throw new Error(`File "${name}" doesn't exist!`)
    return FileSystem.readFileSync(name, 'utf8')
}

export function readFileOrUndefined(name: string): string | undefined {
    if (!FileSystem.existsSync(name)) return undefined
    return FileSystem.readFileSync(name, 'utf8')
}

export async function readFileAsStream(name: string, callback: (lines: string[]) => Promise<void>, lineAmount: number = 100) {
    const fileStream = FileSystem.openSync(name, 'r')
    const bufferSize = 1024 * 1024
    const buffer = Buffer.alloc(bufferSize)
    let leftover: string | undefined = undefined
    let lines: string[] = []
    let bytesRead: number

    while ((bytesRead = FileSystem.readSync(fileStream, buffer, 0, bufferSize, null)) > 0) {
        const chunk = buffer.toString('utf8', 0, bytesRead)
        const linesOfChunks: string[] = chunk.split(/\r?\n/gm)
        if (leftover) linesOfChunks[0] = leftover + linesOfChunks[0]
        leftover = linesOfChunks.pop()
        lines.push(...linesOfChunks)
        while (lines.length > lineAmount) await callback(lines.splice(0, lineAmount))
        lines = lines.splice(lineAmount)
    }

    if (lines.length > 0) await callback(lines)
    FileSystem.closeSync(fileStream)
}

export function writeFile(name: string, content: string | object | unknown[]) {
    const directory = Path.dirname(name)
    if (directory && !FileSystem.existsSync(directory)) FileSystem.mkdirSync(directory)
    FileSystem.writeFileSync(name, typeof content === 'object' || Array.isArray(content) ? JSON.stringify(content, undefined, '\t') : content, 'utf8')
}


export function listDirectory(directory: string = '.', recursive?: boolean): string[] {
    directory = directory || '.'
    const listFiles = (directory: string) => FileSystem.readdirSync(directory).map(name => Path.join(directory, name)).filter(directory => FileSystem.statSync(directory).isFile())
    if (!FileSystem.existsSync(directory)) throw new Error(`Directory "${directory}" doesn't exist!`)
    if (!recursive) return listFiles(directory);
    return FileSystem.readdirSync(directory)
        .map(name => Path.join(directory, name))
        .filter(directory => FileSystem.statSync(directory).isDirectory())
        .map(directory => listDirectory(directory, true))
        .reduce((a, b) => a.concat(b), [])
        .concat(listFiles(directory));
}