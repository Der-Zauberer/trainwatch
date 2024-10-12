/**********
*   Cli   *
**********/

class CliService {

    executeCommand() {
        let branch = commands;
        let args = process.argv.slice(2);
        do {
            this.throwError(args.length === 0, `Not enough arguments! Possible arguments: ${Object.keys(branch)}`);
            const next = branch[args[0]];
            this.throwError(!next, `Command branch "${args[0]}" doesn't exists!`);
            branch = next;
            args = args.slice(1);
        } while (!(typeof branch === 'function'));
        branch(...args);
    }

    throwError(condition, error) {
        if (!condition) return;
        console.log(`ERROR: ${error}`);
        process.exit(-1);
    }

}

class ProgressLogger {

    #name;
    #type;
    #firstLogging = true;

    constructor(name, type) {
        this.#name = name;
        this.#type = type;
    }

    log(message, response) {
        if (!this.#firstLogging) {
            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine(1);
        }
        console.log(`[${this.#name}] ${message}`);
        return response;
    }

    progress(index, amount, name, response) {
        if (this.#firstLogging) {
            this.#firstLogging = false;
        } else {
            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine(1);
        }
        console.log(`[${this.#name}] ${ parseInt((index / amount) * 100) }% (${index}/${amount}) Processing ${this.#name} ${name}`)
        return response;
    }

    finish(amount) {
        if (!this.#firstLogging) {
            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine(1);
        }
        console.log(`[${this.#name}] Successfully processed ${amount ? amount + ' ' : ''}${this.#type}`);
    }

}

/***********
*   Test   *
***********/

class TestService {

    test() {
        const WARMUP_CYCLES = 100;
        const EXECUTION_CYCLES = 10000;
        let passedCount = 0;
        let failedCount = 0;
        for (const test of tests) {
            const result = test.execute();
            for (let i = 0; i < WARMUP_CYCLES; i++) test.execute();
            const durations = []
            for (let i = 0; i < EXECUTION_CYCLES; i++) {
                const startTime = performance.now();
                test.execute();
                const endTime = performance.now();
                durations.push((endTime - startTime) * 1e3);
            }
            const average = durations.length ? durations.reduce((a, b) => a + b) / durations.length : 0;
            if (test.expect === result) {
                console.log(`TEST PASSED: ${test.name} (${average.toFixed(3)}µs)`);
                passedCount++;
            } else {
                console.log(`TEST FAILED: ${test.name} (${average.toFixed(3)}µs)`);
                console.log(`\tExpected: ${test.expect}`);
                console.log(`\tResult: ${result}`);
                failedCount++;
            }
        }
        console.log(`${passedCount} tests passed, ${failedCount} tests failed!`);
    }

}

/*************
*   Search   *
*************/

class SearchService {

    normalize(name, seperator) {
        let formatted = '';
        let blank = false;
        const replacements = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
        for (let char of name.toLowerCase()) {
            if (replacements[char]) {
                formatted += replacements[char];
                blank = false;
            } else if (char === ' ' || char === '/' || char === '-' || char === '(' || char === ')') {
                if (!blank) {
                    if (seperator) formatted += seperator;
                    blank = true;
                }
            } else if ((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
                formatted += char;
                blank = false;
            } else if (char.charCodeAt(0) > 127) {
                const normalized = char.normalize('NFD');
                if (char !== normalized) formatted += normalized[0];
            }
        }
        return formatted;
    }
    
    beginnScoreMatching(search, a, b) {
        const aStartsWithName = a.searchName.startsWith(search);
        const bStartsWithName = b.searchName.startsWith(search);
        if (aStartsWithName && !bStartsWithName) return 1;
        else if (!aStartsWithName && bStartsWithName) return -1;
        else return b.score - a.score;
    }

}

/***************
*   Download   *
***************/

class DownloadService {

}

/**************
*   General   *
**************/

const cliService = new CliService();
const testService = new TestService();
const searchService = new SearchService();
const downloadService = new DownloadService();

const tests = [  
    {
        name: "normalize() should return without seperator",
        execute: () => searchService.normalize('Fäßchen/Brücken-Straße (Brötchen)Compañía'),
        expect: 'faesschenbrueckenstrassebroetchencompania'
    },
    {
        name: "normalize() should return with blank seperator",
        execute: () => searchService.normalize('Fäßchen/Brücken-Straße (Brötchen)Compañía', ' '),
        expect: 'faesschen bruecken strasse broetchen compania'
    },
    {
        name: "normalize() should return with underscore seperator",
        execute: () => searchService.normalize('Fäßchen/Brücken-Straße (Brötchen)Compañía', '_'),
        expect: 'faesschen_bruecken_strasse_broetchen_compania'
    },
    {
        name: "beginnScoreMatching() should match first entry",
        execute: () => searchService.beginnScoreMatching('Karlsruhe', { searchName: 'Karlsruhe Hbf', score: 0 }, { searchName: 'Leipzig Karlsruher Straße', score: 0 }),
        expect: 1
    },
    {
        name: "beginnScoreMatching() should match second entry",
        execute: () => searchService.beginnScoreMatching('Karlsruhe', { searchName: 'Leipzig Karlsruher Straße', score: 0 }, { searchName: 'Karlsruhe Hbf', score: 0 }),
        expect: -1
    },
    {
        name: "beginnScoreMatching() should score first entry",
        execute: () => searchService.beginnScoreMatching('Karlsruhe', { searchName: 'Leipzig Karlsruher Straße', score: 0 }, { searchName: 'Karlsruhe Hbf', score: 1 }),
        expect: -1
    },
    {
        name: "beginnScoreMatching() should score second entry",
        execute: () => searchService.beginnScoreMatching('Karlsruhe', { searchName: 'Karlsruhe Hbf', score: 1 }, { searchName: 'Leipzig Karlsruher Straße', score: 0 }),
        expect: 1
    }
]

const commands = {
    test: testService.test
}

cliService.executeCommand();