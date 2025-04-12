export const CSV = {

    parse<T>(csv: string, seperator: string = ','): T[] {
        const lines: string[] = csv.split(/\r?\n/gm).filter(column => column !== '')
        if (lines.length < 2) return []
        const header = CSV.parseHeader(lines.shift() || '', seperator)
        return CSV.parseChunk(header, lines, seperator)
    },

    parseHeader(header: string, seperator: string = ','): string[] {
        return CSV.splitRow(header, seperator, true).map(row => row.trim())
    },

    parseChunk<T>(header: string[], lines: string[], seperator: string = ','): T[] {
        const entities: T[] = []
        for (const line of lines) {
            const entity: Record<string, unknown> = {}
            const rows = CSV.splitRow(line, seperator).map(row => row.trim())
            for (let i = 0; i < rows.length; i++) {
                const key = header[i] || 'unnamed'
                const value = rows[i]
                if (value === 'true' || value === 'false') entity[key] = value === 'true'
                else if (value === 'undefined' || value === '' || value === '""') entity[key] = undefined
                else if (value === 'null') entity[key] = null
                else if (!isNaN(Number(value)) && value !== '' && value[0] !== '0') entity[key] = Number(value)
                else if (value.length >= 2 && value[0] === '"' && value[value.length - 1] === '"') entity[key] = value.slice(1, -1)
                else entity[key] = rows[i];
            }
            entities.push(entity as T)
        }
        return entities
    },

    splitRow(row: string, seperator: string, filterQuotationMarks: boolean = false): string[] {
        const columns = []
        let column = ''
        let isString = false
        for (let i = 0; i < row.length; i++) {
            if (!isString && row[i] === seperator) {
                columns.push(column)
                column = ''
            } else if (row[i] === '"' && !(isString && i > 0 && row[i - 1] === '\\')) {
                isString = !isString
                if (!filterQuotationMarks) column += row[i]
            } else {
                column += row[i]
            }
        }
        columns.push(column)
        return columns
    },

    stringify(value: Record<string, unknown>[], replacer?: string[] | ((key: string, value: any) => any), seperator: string = ',') {
        const header = new Set<string>()
        for (const entry of value) {
            let keys = Object.keys(entry)
            if (Array.isArray(replacer)) keys = keys.filter(key => replacer.includes(key))
            else if (typeof replacer === 'function') keys = keys.filter(key => value.filter(entry => replacer(key, entry[key])).length)
            keys.forEach(key => header.add(key))
        }
        let csv = ''
        csv += Array.from(header).join(seperator) + '\n'
        for (const entry of value) {
            csv += Array.from(header).map(key => (typeof replacer === 'function' ? replacer(key, entry[key]) : entry[key]) || '').join(seperator)  + '\n'
        }
        return csv
    }

}