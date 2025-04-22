export type Command = {
    execute: (...args: any[]) => void
    usage: string
    description: string
}

export type Commands = {
    [key: string]: Command | Commands
}

export type Test = {
    name: string
    execute: () => unknown
    expect: unknown
}

const CLI_RESET = '\x1b[0m'
const CLI_GREY = '\x1b[90m'
const CLI_RED = '\x1b[31m'
const CLI_YELLOW = '\x1b[33m'
const CLI_GREEN = '\x1b[32m'
const CLI_BLUE = '\x1b[36m'

let stopLoading: (() => void) | undefined = undefined

export function printWarning(warning: unknown) {
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    process.stdout.write(`${CLI_YELLOW}WARNING: ${warning}${CLI_RESET}\n`)
}

export function printError(error: unknown) {
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    process.stdout.write(`${CLI_RED}ERROR: ${error}${CLI_RESET}\n`)
    process.exit(-1)
}

export function executeCommand(commands: Commands) {
    let branch: Command | Commands = commands
    let args: string[] = process.argv.slice(2)
    do {
        if (args.length === 0) printError(`Not enough arguments! Possible arguments: ${Object.keys(branch)}`)
        if (args[0] === 'help') {
            for (const entry of getCommandHelp(branch)) {
                console.log(`${entry.usage} ${CLI_GREY}${entry.description}${CLI_RESET}`)
            }
            return
        }
        const next: Command | Commands = branch[args[0]]
        if (!next) printError(`Command branch "${args[0]}" doesn't exists!`)
        branch = next
        args = args.slice(1)
    } while (!isCommand(branch))
    branch.execute(...args)
}

export function getCommandHelp(branch: Commands): Command[] {
    const list: Command[] = [] 
    for (const command of Object.values(branch)) {
        if (isCommand(command)) {
            list.push(command)
        } else {
            list.push(...getCommandHelp(command))
        }
    }
    return list
}

function isCommand(entry: Command | Commands): entry is Command {
    return typeof (entry as Command).execute === 'function';
}

export function test(tests: Test[], benchmark?: boolean) {
    const WARMUP_CYCLES = 100
    const EXECUTION_CYCLES = 5000
    let passedCount: number = 0
    let failedCount: number = 0
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
            console.log(`\tError: ${CLI_RED}${(error as { stack: string }).stack.replaceAll('\n', '\n\t')}${CLI_RESET}`)
        }
    }
    console.log(`${CLI_GREEN}${passedCount}${CLI_RESET} tests passed, ${CLI_RED}${failedCount}${CLI_RESET} tests failed!`)
    if (failedCount > 0) process.exit(-1)
}

export class Logger {

    private readonly prefix: string

    private timestamp?: number
    private durations: number = 0

    constructor(private readonly name: string) {
        this.prefix = name ? `${CLI_BLUE}[${this.name}]${CLI_RESET}` : '';
    }

    print(message: unknown, finish?: boolean) {
        const output = `${this.prefix} ${typeof message === 'object' || Array.isArray(message) ? JSON.stringify(message) : message || ''}\n`
        if (finish) stopLoading?.()
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(output)
    }

    printLoading(message: unknown) {
        stopLoading?.()
        const output = `${this.prefix} ${typeof message === 'object' || Array.isArray(message) ? JSON.stringify(message) : message || ''}`
        let i = 0;
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(output)
        const interval = setInterval(() => {
            process.stdout.clearLine(0)
            process.stdout.cursorTo(0)
            i = (i + 1) & 3;
            process.stdout.write(`${output} ${'.'.repeat(i)}`)
        }, 250)
        stopLoading = () => { clearInterval(interval) }
    }

    /**
     * @param { number } index 
     * @param { number } amount 
     * @param { string } status 
     * @param { string | number | boolean | object | unknown[] } [message]
     */
    printProgress(index: number, amount: number, status: string, message?: unknown) {
        stopLoading?.()
        const now = performance.now();
        let time = '';
        if (this.timestamp) {
            const duration = now - this.timestamp
            this.durations += duration
            const estimation = (this.durations / index * (amount - index)) / 1000
            time = `${CLI_GREY}${Math.floor((estimation / 60))}m ${Math.floor(estimation % 60)}s${CLI_RESET}`
        }
        this.timestamp = now;
        if (amount === index - 1 || index == 0) {
            this.timestamp = 0
            this.durations = 0
        }
        const output = `${this.prefix} ${(((index + 1) / amount) * 100).toFixed(0)}% (${index + 1}/${amount}) ${status} ${time} ${typeof message === 'object' || Array.isArray(message) ? JSON.stringify(message) : message || ''}`
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(`${output}`)
    }

}