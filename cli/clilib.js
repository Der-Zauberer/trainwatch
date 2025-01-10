//@ts-check

const process = require('node:process')
const FileSystem = require('node:fs')
const Path = require('path')

/************
*   Types   *
************/

const CLI_RESET = '\x1b[0m'
const CLI_GREY = '\x1b[90m'
const CLI_RED = '\x1b[31m'
const CLI_YELLOW = '\x1b[33m'
const CLI_GREEN = '\x1b[32m'
const CLI_BLUE = '\x1b[36m'

class Command {
    /** @type { (args: any[]) => void } */
    execute
    /** @type { string } */
    usage
    /** @type { string } */
    description
}

class Test {
    /** @type { string } */
    name
    /** @type { () => any } */
    execute
    /** @type { any } */
    expect
}

/**********
*   Cli   *
**********/


/** @type { (() => void) | undefined } */
let stopLoading = undefined

/**
 * @param { string } error
 */
function printWarning(error) {
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    process.stdout.write(`${CLI_YELLOW}WARNING: ${error}${CLI_RESET}\n`)
}

/**
 * @param { string } error
 */
function printError(error) {
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    process.stdout.write(`${CLI_RED}ERROR: ${error}${CLI_RESET}\n`)
    process.exit(-1)
}

/**
 * @param { any } commands
 */
function executeCommand(commands) {
    let branch = commands
    let args = process.argv.slice(2)
    do {
        if (args.length === 0) printError(`Not enough arguments! Possible arguments: ${Object.keys(branch)}`)
        if (args[0] === 'help') {
            for (const entry of getCommandHelp(branch)) {
                console.log(`${entry.usage} ${CLI_GREY}${entry.description}${CLI_RESET}`)
            }
            return
        }
        const next = branch[args[0]]
        if (!next) printError(`Command branch "${args[0]}" doesn't exists!`)
        branch = next
        args = args.slice(1)
    } while (!(typeof branch.execute === 'function'))
    branch.execute(...args)
}

function getCommandHelp(branch) {
    const /** @type {Command[]} */ list = [] 
    for (const entry of Object.values(branch)) {
        if (entry.execute) {
            list.push(entry)
        } else {
            list.push(...getCommandHelp(entry))
        }
    }
    return list
}

/*************
*   Logger   *
*************/

class Logger {

    /** @type { string | undefined } */
    #name
    /** @type { string } */
    #prefix
    /** @type { number } */
    #timestamp

    /**
     * @param { string } [name] 
     */
    constructor(name) {
        this.#name = name
        this.#prefix = name ? `${CLI_BLUE}[${this.#name}]${CLI_RESET}` : '';
    }

    get name() { return this.#name }

    /**
     * @param { string | number | boolean | object | any[] } message
     * @param { boolean } [finish]
     */
    print(message, finish) {
        const output = `${this.#prefix} ${typeof message === 'object' || Array.isArray(message) ? JSON.stringify(message) : message}\n`
        if (finish) stopLoading?.()
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(output)
    }

    /**
     * @param { string | number | boolean | object | any[] } message 
     */
    printLoading(message) {
        stopLoading?.()
        const output = `${this.#prefix} ${typeof message === 'object' || Array.isArray(message) ? JSON.stringify(message) : message}`
        let i = 0;
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(output)
        const interval = setInterval(() => {
            process.stdout.clearLine(0)
            process.stdout.cursorTo(0)
            i = (i + 1) & 3;
            process.stdout.write(`${output}${'.'.repeat(i)}`)
        }, 250)
        stopLoading = () => { clearInterval(interval) }
    }

    /**
     * @param { number } index 
     * @param { number } amount 
     * @param { string } status 
     * @param { string | number | boolean | object | any[] } [message]
     */
    printProgress(index, amount, status, message) {
        stopLoading?.()
        const seconds = performance.now() / 1000;
        let time = '';
        if (this.#timestamp) {
            const duration = seconds - this.#timestamp
            const estimation = duration * (amount - 1 - index)
            time = `${CLI_GREY}${(estimation / 60).toFixed(0)}m ${(estimation % 60).toFixed(0)}s${CLI_RESET}`
        }
        this.#timestamp = seconds;
        const output = `${this.#prefix} ${(((index + 1) / amount) * 100).toFixed(0)}% (${index + 1}/${amount}) ${status} ${time} ${typeof message === 'object' || Array.isArray(message) ? JSON.stringify(message) : message}`
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(`${output}`)
    }

}


/**********
*   CSV   *
**********/

const CSV = {

    /**
     * @param { string } csv 
     * @param { string } [seperator]
     * @returns { any[] }
     */
    parse(csv, seperator) {
        seperator = seperator || ','
        const lines = csv.split(/\r?\n/gm).filter(column => column !== '')
        if (lines.length < 2) return []
        const header = CSV.parseHeader(lines.shift() || '', seperator)
        return CSV.parseChunk(header, lines, seperator)
    },

    /**
     * @param { string } header
     * @param { string } [seperator]
     * @returns { string[] }
     */
    parseHeader(header, seperator) {
        seperator = seperator || ','
        return CSV.splitRow(header, seperator, true).map(row => row.trim())
    },

    /**
     * @param { string[] } header
     * @param { string[] } lines
     * @param { string } [seperator]
     * @returns { any[] }
     */
    parseChunk(header, lines, seperator) {
        seperator = seperator || ','
        const entities = []
        for (const line of lines) {
            const entity = {}
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
            entities.push(entity)
        }
        return entities
    },

    /**
     * 
     * @param { string } row 
     * @param { string } seperator 
     * @param { boolean } [filterQuotationMarks]
     * @returns { string[] }
     */
    splitRow(row, seperator, filterQuotationMarks) {
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

    /**
     * @param { any[] } value 
     * @param { string[] | ((key: string, value: any) => any) } [replacer]
     * @param { string } [seperator]
     * @returns { string }
     */
    stringify(value, replacer, seperator) {
        const SEPERATOR = seperator || ','
        const header = new Set()
        for (const entry of value) {
            let keys = Object.keys(entry)
            if (Array.isArray(replacer)) keys = keys.filter(key => replacer.includes(key))
            else if (typeof replacer === 'function') keys = keys.filter(key => value.filter(entry => replacer(key, entry[key])).length)
            keys.forEach(key => header.add(key))
        }
        let csv = ''
        csv += Array.from(header).join(SEPERATOR) + '\n'
        for (const entry of value) {
            csv += Array.from(header).map(key => (typeof replacer === 'function' ? replacer(key, entry[key]) : entry[key]) || '').join(SEPERATOR)  + '\n'
        }
        return csv
    }

}

/************
*   Files   *
************/

const FILES = {

    /**
     * @param { string } name
     * @returns { string }
     */
    read(name) {
        if (!FileSystem.existsSync(name)) throw new Error(`File "${name}" doesn't exist!`)
        return FileSystem.readFileSync(name, 'utf8')
    },

    /**
     * @param { string } name
     * @returns { string | undefined }
     */
    readOrUndefined(name) {
        if (!FileSystem.existsSync(name)) return undefined
        return FileSystem.readFileSync(name, 'utf8')
    },

    /**
     * 
     * @param { string } name 
     * @param { (lines: string[])  => void } callback
     * @param { number } [lineAmount]
     */
    readAsStream(name, callback, lineAmount) {
        lineAmount = lineAmount || 100
        const fileStream = FileSystem.openSync(name, 'r');
        const bufferSize = 1024 * 1024;
        const buffer = Buffer.alloc(bufferSize);
        let lines = [];
        let bytesRead;

        while ((bytesRead = FileSystem.readSync(fileStream, buffer, 0, bufferSize, null)) > 0) {
            buffer.toString('utf8', 0, bytesRead).split(/\r?\n/gm).forEach(line => lines.push(line));
            while (lines.length > lineAmount) callback(lines.splice(0, lineAmount))
            lines = lines.splice(lineAmount)
        }

        if (lines.length > 0) callback(lines)
        FileSystem.closeSync(fileStream);
    },

    /**
     * @param { string } name
     * @param { string | object | any[] } content
     */
    write(name, content) {
        const directory = Path.dirname(name)
        if (directory && !FileSystem.existsSync(directory)) FileSystem.mkdirSync(directory)
        FileSystem.writeFileSync(name, typeof content === 'object' || Array.isArray(content) ? JSON.stringify(content, undefined, '\t') : content, 'utf8')
    },

    /**
     * @param { string } [directory]
     * @param { boolean } [recursive]
     * @returns { string[] }
     */
    list(directory, recursive) {
        directory = directory || '.'
        const listFiles = (directory) => FileSystem.readdirSync(directory).map(name => Path.join(directory, name)).filter(directory => FileSystem.statSync(directory).isFile())
        if (!FileSystem.existsSync(directory)) throw new Error(`Directory "${directory}" doesn't exist!`)
        if (!recursive) return listFiles(directory);
        return FileSystem.readdirSync(directory)
            .map(name => Path.join(directory, name))
            .filter(directory => FileSystem.statSync(directory).isDirectory())
            .map(directory => this.list(directory, true))
            .reduce((a, b) => a.concat(b), [])
            .concat(listFiles(directory));
    }

}

/*************
*   Search   *
*************/

const SEARCH = {

    /**
     * @param { string } name
     * @param { string } [seperator]
     * @returns { string }
     */
    normalize(name, seperator) {
        const replacements = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }
        const isWhitespace = (char) => char === ' ' || char === '/' || char === '-' || char === '(' || char === ')'
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
    },

    /**
     * @param { { [key: string]: string | number | string[] | number[] } } object
     * @returns { string[] }
     */
    extractIds(object) {
        const ids = []
        for (const [key, value] of Object.entries(object)) {
            if (Array.isArray(value)) {
                value.forEach(id => ids.push(id.toString().toLowerCase()))
            } else {
                ids.push(value.toString().toString().toLowerCase())
            }
        }
        return ids
    },

    /**
     * @param { string } name 
     * @returns { string[] }
     */
    nWordEdgeNgram(name) {
        const parts = []
        let currentName = ''
        for (let i = name.length -1; i >= 0; i--) {
            if (name[i] !== ' ') currentName = name[i] + currentName
            else parts.unshift(currentName)
        }
        parts.unshift(currentName)
        const result = []
        for (const part of parts) {
            for (let i = 1; i <= part.length; i++) {
                result.push(part.slice(0, i))
            }
        }
        return result
    },
    
    /**
     * @param { string } search
     * @param {{ search: string, score: number }} a
     * @param {{ search: string, score: number }} b
     */
    beginnScoreMatching(search, a, b) {
        const size = (number) => number === 0 ? 1 : Math.floor(Math.log10(number)) + 1
        if (size(a.score) !== size(b.score)) return a.score - b.score
        const aStartsWithName = a.search.startsWith(search)
        const bStartsWithName = b.search.startsWith(search)
        if (aStartsWithName && !bStartsWithName) return -1
        else if (!aStartsWithName && bStartsWithName) return 1
        else return a.score - b.score
    },

    /**
     * @param { string } search
     * @param { { search: string, score: number }[] } entities
     */
    sortBeginnScoreMatching(search, entities) {
        return entities.sort((a, b) => this.beginnScoreMatching(search, a, b))
    }

}

/***********
*   Test   *
***********/

/**
 * @param { Test[] } tests
 * @param { boolean } [benchmark]
 */
function test(tests, benchmark) {
    const WARMUP_CYCLES = 100
    const EXECUTION_CYCLES = 5000
    let passedCount = 0
    let failedCount = 0
    for (const test of tests) {
        try { 
            const result = test.execute()
            let average = undefined
            if (benchmark) {
                const consoleLog = console.log;
                console.log = () => {}
                for (let i = 0; i < WARMUP_CYCLES; i++) test.execute()
                const durations = []
                for (let i = 0; i < EXECUTION_CYCLES; i++) {
                    const startTime = performance.now()
                    test.execute()
                    const endTime = performance.now()
                    durations.push((endTime - startTime) * 1e3)
                }
                console.log = consoleLog
                average = durations.length ? durations.reduce((a, b) => a + b) / durations.length : 0
            }
            if (JSON.stringify(test.expect) === JSON.stringify(result)) {
                const duration = average ? `(${average.toFixed(3)}µs)` : ''
                console.log(`${CLI_GREEN}TEST PASSED:${CLI_RESET} ${test.name} ${CLI_GREY}${duration}${CLI_RESET}`)
                passedCount++
            } else {
                console.log(`${CLI_RED}TEST FAILED:${CLI_RESET} ${test.name}`)
                console.log(`\tExpected: ${CLI_BLUE}${JSON.stringify(test.expect)}${CLI_RESET}`)
                console.log(`\t  Result: ${CLI_RED}${CLI_RED}${JSON.stringify(result)}${CLI_RESET}`)
                failedCount++
            }
        } catch (error) {
            failedCount++
            console.log(`${CLI_RED}TEST FAILED:${CLI_RESET} ${test.name}`)
            console.log(`\tError: ${CLI_RED}${error.stack.replaceAll('\n', '\n\t')}${CLI_RESET}`)
        }
    }
    console.log(`${CLI_GREEN}${passedCount}${CLI_RESET} tests passed, ${CLI_RED}${failedCount}${CLI_RESET} tests failed!`)
    if (failedCount > 0) process.exit(-1)
}

function testLib() {
    test([
        {
            name: 'SEARCH.normalize() should return without seperator',
            execute: () => SEARCH.normalize(' Fäßchen/Brücken-Straße (Brötchen)Compañía '),
            expect: 'faesschenbrueckenstrassebroetchencompania'
        },
        {
            name: 'SEARCH.normalize() should return with blank seperator',
            execute: () => SEARCH.normalize(' Fäßchen/Brücken-Straße (Brötchen)Compañía ', ' '),
            expect: 'faesschen bruecken strasse broetchen compania'
        },
        {
            name: 'SEARCH.normalize() should return with underscore seperator',
            execute: () => SEARCH.normalize(' Fäßchen/Brücken-Straße (Brötchen)Compañía ', '_'),
            expect: 'faesschen_bruecken_strasse_broetchen_compania'
        },
        {
            name: 'SEARCH.extractIds() should extract ids',
            execute: () => SEARCH.extractIds({ eva: 8011160, stada: 1071, ril: [ 'BHBF', 'BL', 'BLS' ] }),
            expect: [ '8011160', '1071', 'bhbf', 'bl', 'bls' ]
        },
        {
            name: 'SEARCH.beginnScoreMatching() should match first entry',
            execute: () => SEARCH.beginnScoreMatching('Karlsruhe', { search: 'Karlsruhe Hbf', score: 0 }, { search: 'Leipzig Karlsruher Straße', score: 0 }),
            expect: -1
        },
        {
            name: 'SEARCH.beginnScoreMatching() should match second entry',
            execute: () => SEARCH.beginnScoreMatching('Karlsruhe', { search: 'Leipzig Karlsruher Straße', score: 0 }, { search: 'Karlsruhe Hbf', score: 0 }),
            expect: 1
        },
        {
            name: 'SEARCH.beginnScoreMatching() should score second entry',
            execute: () => SEARCH.beginnScoreMatching('Karlsruhe', { search: 'Leipzig Karlsruher Straße', score: 0 }, { search: 'Karlsruhe Hbf', score: 1 }),
            expect: 1
        },
        {
            name: 'SEARCH.beginnScoreMatching() should score second entry',
            execute: () => SEARCH.beginnScoreMatching('Karlsruhe', { search: 'Leipzig Karlsruher Straße', score: 1 }, { search: 'Karlsruhe Hbf', score: 0 }),
            expect: 1
        },
        {
            name: 'SEARCH.beginnScoreMatching() should rank first entry',
            execute: () => SEARCH.beginnScoreMatching('Karlsruhe', { search: 'Karlsruhe Hbf', score: 10 }, { search: 'Leipzig Karlsruher Straße', score: 1 }),
            expect: 9
        },
        {
            name: 'SEARCH.nWordEgeNgram() should return N-Word-Edge-Ngram',
            execute: () => SEARCH.nWordEdgeNgram('What why'),
            expect: ['W', 'Wh', 'Wha', 'What', 'Whatw', 'Whatwh', 'Whatwhy', 'w', 'wh', 'why']
        },
        {
            name: 'CSV.parse() should parse CSV',
            execute: () => {
                const csv = 'id;name;platforms\nsingen_hohentwiel;Singen (Hohentwiel);8\nradolfzell;Radolfzell;\n'
                return CSV.parse(csv, ';')
            },
            expect: [ { id: 'singen_hohentwiel', name: 'Singen (Hohentwiel)', platforms: 8 }, { id: 'radolfzell', name: 'Radolfzell' } ]
        },
        {
            name: 'CSV.stringify() should stringify CSV',
            execute: () => {
                const csv = [ { id: 'singen_hohentwiel', name: 'Singen (Hohentwiel)', platforms: 8 }, { id: 'radolfzell', name: 'Radolfzell' } ]
                return CSV.stringify(csv, undefined, ';')
            },
            expect: 'id;name;platforms\nsingen_hohentwiel;Singen (Hohentwiel);8\nradolfzell;Radolfzell;\n'
        },
        {
            name: 'CSV.stringify() should stringify CSV with replacer array',
            execute: () => {
                const csv = [ { id: 'singen_hohentwiel', name: 'Singen (Hohentwiel)', platforms: 8 }, { id: 'radolfzell', name: 'Radolfzell' } ]
                return CSV.stringify(csv, ['id', 'name'], ';')
            },
            expect: 'id;name\nsingen_hohentwiel;Singen (Hohentwiel)\nradolfzell;Radolfzell\n'
        },
        {
            name: 'CSV.stringify() should stringify CSV with replacer function',
            execute: () => {
                const csv = [ { id: 'singen_hohentwiel', name: 'Singen (Hohentwiel)', platforms: 8 }, { id: 'radolfzell', name: 'Radolfzell' } ]
                return CSV.stringify(csv, (key, value) => key === 'id' ? `id:${value}` : value, ';')
            },
            expect: 'id;name;platforms\nid:singen_hohentwiel;Singen (Hohentwiel);8\nid:radolfzell;Radolfzell;\n'
        },
        {
            name: 'CSV.stringify() should stringify CSV with filter replacer function',
            execute: () => {
                const csv = [ { id: 'singen_hohentwiel', name: 'Singen (Hohentwiel)', platforms: 8 }, { id: 'radolfzell', name: 'Radolfzell' } ]
                return CSV.stringify(csv, (key, value) => key === 'id' ? undefined : value, ';')
            },
            expect: 'name;platforms\nSingen (Hohentwiel);8\nRadolfzell;\n'
        }
    ], true)
}

/**************
*   Exports   *
**************/

module.exports = {
    Command,
    Test,
    Logger,
    CSV,
    SEARCH,
    FILES,
    printWarning,
    printError,
    executeCommand,
    test,
    testLib,
}