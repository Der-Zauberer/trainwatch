//@ts-check

const process = require('node:process')

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
let removeTemporaryLastLine = undefined
/** @type { (() => void) | undefined } */
let stopLoading = undefined

/**
 * @param { string } error
 * @param { boolean } [condition]
 */
function printWarning(error, condition) {
    if (!condition) return
    removeTemporaryLastLine?.()
    stopLoading?.()
    console.log(`${CLI_YELLOW}WARNING: ${error}${CLI_RESET}`)
}

/**
 * @param { string } error
 * @param { boolean } [condition]
 */
function printError(error, condition) {
    if (!condition) return
    removeTemporaryLastLine?.()
    stopLoading?.()
    console.log(`${CLI_RED}ERROR: ${error}${CLI_RESET}`)
    process.exit(-1)
}

/**
 * @param { any } commands
 */
function executeCommand(commands) {
    let branch = commands
    let args = process.argv.slice(2)
    do {
        printError(`Not enough arguments! Possible arguments: ${Object.keys(branch)}`, args.length === 0)
        if (args[0] === 'help') {
            for (const entry of getCommandHelp(branch)) {
                console.log(`${entry.usage} ${CLI_GREY}${entry.description}${CLI_RESET}`)
            }
            return
        }
        const next = branch[args[0]]
        printError(`Command branch "${args[0]}" doesn't exists!`, !next)
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
    /** @type { string | undefined } */
    #type
    /** @type { string } */
    #prefix
    /** @type { number | undefined } */
    #timestamnp
    /** @type { number } */
    #durations = 0

    /**
     * @param { string } [name] 
     * @param { string } [type]
     */
    constructor(name, type) {
        this.#name = name
        this.#type = type
        this.#prefix = name ? `${CLI_BLUE}[${this.#name}]${CLI_RESET}` : '';
    }

    get name() { return this.#name }
    get type() { return this.#type }

    /**
     * @param { string } message
     * @param { any } [response]
     * @returns { any }
     */
    print(message, response) {
        removeTemporaryLastLine?.()
        stopLoading?.()
        console.log(`${this.#prefix} ${message}`)
        return response
    }

    /**
     * @param { string } message
     * @returns { any }
     */
    printLoading(message) {
        removeTemporaryLastLine?.()
        stopLoading?.()
        console.log(`${this.#prefix} ${message}`)
        const logLoading = (/** @type {number} */ count) => {
            const output = `${this.#prefix} ${message} ${'.'.repeat(count)}`
            process.stdout.moveCursor(0, -1)
            process.stdout.clearLine(1)
            console.log(output)
        }
        let i = 0
        const interval = setInterval(() => {
            if (i === 4) i = 0
            logLoading(i++)
        }, 250)
        stopLoading = () => {
            clearInterval(interval)
            logLoading(0)
            stopLoading = undefined
        }
    }

    /**
     * @param { number } index
     * @param { number } amount
     * @param { string } progressiveVerb
     * @param { string } [name]
     * @returns { any }
     */
    printProgress(index, amount, progressiveVerb, name) {
        const now = performance.now() / 1000;
        let time = '';
        if (this.#timestamnp) {
            const duration = now - this.#timestamnp;
            this.#durations += duration;
            const estimation = this.#durations / index * (amount - index)
            time = `${CLI_GREY}${(estimation / 60).toFixed(0)}m ${(estimation % 60).toFixed(0)}s${CLI_RESET}`
        }
        this.#timestamnp = now;
        const output = `${this.#prefix} ${ ((index / amount) * 100).toFixed(0) }% (${index}/${amount}) ${progressiveVerb} ${this.#type} ${name ? name + ' ' : ''}${time}`
        removeTemporaryLastLine?.()
        stopLoading?.()
        console.log(output)
        removeTemporaryLastLine = () => {
            process.stdout.moveCursor(0, -1)
            process.stdout.clearLine(1)
            removeTemporaryLastLine = undefined
        }
    }

    /**
     * @param { string } pastVerb
     * @param { number } amount
     */
    printFinish(pastVerb, amount) {
        removeTemporaryLastLine?.()
        stopLoading?.()
        this.#timestamnp = undefined;
        this.#durations = 0;
        console.log(`${this.#prefix} Successfully ${pastVerb} ${amount ? amount + ' ' : ''}${this.#type}`)
    }

}

/***********
*   Test   *
***********/

/**
 * @param { Test[] } tests 
 */
function test(tests) {
    const WARMUP_CYCLES = 100
    const EXECUTION_CYCLES = 5000
    let passedCount = 0
    let failedCount = 0
    for (const test of tests) {
        try { 
            const result = test.execute()
            for (let i = 0; i < WARMUP_CYCLES; i++) test.execute()
            const durations = []
            for (let i = 0; i < EXECUTION_CYCLES; i++) {
                const startTime = performance.now()
                test.execute()
                const endTime = performance.now()
                durations.push((endTime - startTime) * 1e3)
            }
            const average = durations.length ? durations.reduce((a, b) => a + b) / durations.length : 0
            if (JSON.stringify(test.expect) === JSON.stringify(result)) {
                console.log(`${CLI_GREEN}TEST PASSED:${CLI_RESET} ${test.name} ${CLI_GREY}(${average.toFixed(3)}µs)${CLI_RESET}`)
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

/**************
*   Exports   *
**************/

module.exports = {
    Command,
    Test,
    printWarning,
    printError,
    executeCommand,
    Logger,
    test
}