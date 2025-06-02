export type Entity = {
    search: string
    score: number
}

export function normalize(name: string, seperator?: string): string {
    const replacements: Record<string, string> = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }
    const isWhitespace = (char: string) => char === ' ' || char === '/' || char === '-' || char === '(' || char === ')'
    let formatted = ''
    let blank = name.length > 0 && isWhitespace(name[0])
    for (let char of name.toLowerCase()) {
        if (replacements[char]) {
            formatted += replacements[char]
            blank = false
        } else if (isWhitespace(char)) {
            if (!blank) {
                if (seperator) formatted += seperator
                blank = true
            }
        } else if ((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
            formatted += char
            blank = false
        } else if (char.charCodeAt(0) > 127) {
            const normalized = char.normalize('NFD')
            if (char !== normalized) formatted += normalized[0]
        }
    }
    if (blank && seperator) {
        return formatted.slice(0, -1)
    }
    return formatted
}

export function extractIds(object: Record<string, string | string[] | number>): string[] {
    const ids: string[] = []
    for (const [key, value] of Object.entries(object)) {
        if (Array.isArray(value)) {
            value.forEach(id => ids.push(id.toString().toLowerCase()))
        } else {
            ids.push(value.toString().toString().toLowerCase())
        }
    }
    return ids
}

export function nWordEdgeNgram(name: string): string[] {
    const parts: string[] = []
    let currentName = ''
    for (let i = name.length -1; i >= 0; i--) {
        if (name[i] !== ' ') currentName = name[i] + currentName
        else parts.unshift(currentName)
    }
    parts.unshift(currentName)
    const result: string[] = []
    for (const part of parts) {
        for (let i = 1; i <= part.length; i++) {
            result.push(part.slice(0, i))
        }
    }
    return result
}

export function beginnScoreMatching(search: string, a: Entity, b: Entity): number {
    const size = (number: number) => number === 0 ? 1 : Math.floor(Math.log10(number)) + 1
    if (size(a.score) !== size(b.score)) return a.score - b.score
    const aStartsWithName = a.search.startsWith(search)
    const bStartsWithName = b.search.startsWith(search)
    if (aStartsWithName && !bStartsWithName) return -1
    else if (!aStartsWithName && bStartsWithName) return 1
    else return a.score - b.score
}

export function sortBeginnScoreMatching(search: string, entities: Entity[]): Entity[] {
    return entities.sort((a, b) => beginnScoreMatching(search, a, b))
}

export function guid() {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
    let guid = ''
    for (let i = 0; i < 20; i++) guid += chars[Math.floor(Math.random() * chars.length)]
    return guid
}