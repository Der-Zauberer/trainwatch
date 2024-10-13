//@ts-check

const FileSystem = require('node:fs');
const Path = require('path');

/************
*   Types   *
************/

class Command {
    /** @type { (args: any[]) => void } */
    function;
    /** @type { string } */
    usage;
    /** @type { string } */
    description;
}

/**********
*   Cli   *
**********/

class CliService {

    static CLI_RESET = '\x1b[0m';
    static CLI_RED = '\x1b[31m';
    static CLI_YELLOW = '\x1b[33m';
    static CLI_GREEN = '\x1b[32m';
    static CLI_BLUE = '\x1b[36m';

    /** @type { string | undefined } */
    #name;

    /** @type { (() => void) | undefined } */
    #removeTemporaryLastLine = undefined;
    /** @type { (() => void) | undefined } */
    #stopLoading = undefined;

    /**
     * @param { string } [name] 
     */
    constructor(name) {
        this.#name = name;
    }

    executeCommand() {
        let branch = commands;
        let args = process.argv.slice(2);
        do {
            this.printError(args.length === 0, `Not enough arguments! Possible arguments: ${Object.keys(branch)}`);
            if (args[0] === 'help') {
                for (const entry of this.#getHelp(branch)) {
                    console.log(`${entry.usage}\t\t${entry.description}`)
                }
                return;
            }
            const next = branch[args[0]];
            this.printError(!next, `Command branch "${args[0]}" doesn't exists!`);
            branch = next;
            args = args.slice(1);
        } while (!(typeof branch.function === 'function'));
        branch.function(...args);
    }

    /**
     * @param { object | Command } branch
     * @returns { Command[] }
     */
    #getHelp(branch) {
        const /** @type {Command[]} */ list = []; 
        for (const entry of Object.values(branch)) {
            if (entry.function) {
                list.push(entry);
            } else {
                list.push(...this.#getHelp(entry));
            }
        }
        return list;
    }

    /**
     * @param { string } [name] 
     * @returns { string }
     */
    #constructName(name) {
        return name ? `${CliService.CLI_BLUE}[${this.#name}]${CliService.CLI_RESET}` : '';
    }

    /**
     * @param { string } message
     * @param { any } [response]
     * @returns { any }
     */
    print(message, response) {
        this.#removeTemporaryLastLine?.();
        this.#stopLoading?.();
        console.log(`${this.#constructName(this.#name)} ${message}`);
        return response;
    }

    /**
     * @param { string } message
     * @param { any } [response]
     * @returns { any }
     */
    printLoading(message, response) {
        this.#removeTemporaryLastLine?.();
        this.#stopLoading?.();
        console.log(`${this.#constructName(this.#name)} ${message}`);
        const logLoading = (count) => {
            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine(1);
            console.log(`${this.#constructName(this.#name)} ${message} ${'.'.repeat(count)}`);
        }
        let i = 0;
        const interval = setInterval(() => {
            if (i === 4) i = 0;
            logLoading(i++);
        }, 250);
        this.#stopLoading = () => {
            clearInterval(interval);
            logLoading(0);
            this.#stopLoading = undefined;
        }
        return response;
    }

    /**
     * @param { number } index
     * @param { number } amount
     * @param { string } name
     * @param { any } [response]
     * @returns { any }
     */
    printProgress(index, amount, name, response) {
        this.#removeTemporaryLastLine?.();
        this.#stopLoading?.();
        console.log(`${this.#constructName(this.#name)} ${ ((index / amount) * 100).toFixed(0) }% (${index}/${amount}) Processing ${this.#name} ${name}`);
        this.#removeTemporaryLastLine = () => {
            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine(1);
            this.#removeTemporaryLastLine = undefined;
        }
        return response;
    }

    /**
     * @param { string } type
     * @param { number } [amount]
     */
    printFinish(type, amount) {
        this.#removeTemporaryLastLine?.();
        this.#stopLoading?.();
        console.log(`${this.#constructName(this.#name)} Successfully processed ${amount ? amount + ' ' : ''}${type}`);
    }

    /**
     * @param { boolean } condition
     * @param { string } error
     */
    printError(condition, error) {
        if (!condition) return;
        console.log(`${CliService.CLI_RED}ERROR: ${error}${CliService.CLI_RESET}`);
        process.exit(-1);
    }

}

/***********
*   File   *
***********/

class FileService {

    /**
     * @param { string | undefined } path
     * @param { string } name
     */
    readFile(path, name) {
        FileSystem.readFileSync(path ? Path.join(path, name) : name, 'utf8');
    }

    /**
     * @param { string | undefined } path
     * @param { string } name
     * @param { string } content
     */
    writeFile(path, name, content) {
        const filePath = path ? Path.join(path, name) : name;
        const directory = Path.dirname(filePath);
        if (directory && !FileSystem.existsSync(directory)) FileSystem.mkdirSync(directory);
        FileSystem.writeFileSync(filePath, content, 'utf8');
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
                console.log(`${CliService.CLI_GREEN}TEST PASSED:${CliService.CLI_RESET} ${test.name} (${average.toFixed(3)}µs)`);
                passedCount++;
            } else {
                console.log(`${CliService.CLI_RED}TEST FAILED:${CliService.CLI_RESET} ${test.name} (${average.toFixed(3)}µs)`);
                console.log(`\tExpected: ${CliService.CLI_BLUE}${test.expect}${CliService.CLI_RESET}`);
                console.log(`\tResult: ${CliService.CLI_RED}${CliService.CLI_RED}${result}${CliService.CLI_RESET}`);
                failedCount++;
            }
        }
        console.log(`${CliService.CLI_GREEN}${passedCount}${CliService.CLI_RESET} tests passed, ${CliService.CLI_RED}${failedCount}${CliService.CLI_RESET} tests failed!`);
    }

}

/*************
*   Search   *
*************/

class SearchService {

    /**
     * @param { string } name
     * @param { string } [seperator]
     * @returns { string }
     */
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
    
    /**
     * @param { string } search
     * @param {{ searchName: string; score: number; }} a
     * @param {{ searchName: string; score: number; }} b
     */
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

    /**
     * @param { string } clientId
     * @param { string } apikey
     * @param { string } [path]
     */
    downloadApiDBStada(clientId, apikey, path) {
        const cliService = new CliService('DB/Stada');
        cliService.printError(!clientId || !apikey, `Require client-id and api-key as argumnets!`);
        const outputAsFile = path?.endsWith('.json');
        const url = 'https://apis.deutschebahn.com/db-api-marketplace/apis/station-data/v2/stations'
        const headers = { 'DB-Client-Id': clientId, 'DB-Api-Key': apikey }
        cliService.printLoading(`Downloading stations from ${url}`);
        fetch(url, { headers })
            .then(response => cliService.printLoading('Parsing stations', response))
            .then(response => response.ok ? response.json() : Promise.reject())
            .then(response => {
                let i = 1;
                const newStations = [];
                for (const station of response.result) {
                    try {
                        if (station.evaNumbers.length == 0) {
                            i++;
                            continue;
                        }
                        const newStation = {
                            id: searchService.normalize(station.name, '_'),
                            name: station.name,
                            score: station.category,
                            location: false ? {} : {
                                latitude: station.evaNumbers[0].geographicCoordinates.coordinates[1],
                                longitude: station.evaNumbers[0].geographicCoordinates.coordinates[0]
                            },
                            address: {
                                street: station.mailingAddress.street.replace('str.', 'straße').replace('  ', ' '),
                                zipcode: station.mailingAddress.zipcode,
                                city: station.mailingAddress.city,
                                federalState: station.federalState,
                                country: 'Deutschland'
                            },
                            open: !station.localServiceStaff || !station.localServiceStaff.availability ? {} : {
                                monday: station.localServiceStaff.availability.monday ? station.localServiceStaff.availability.monday.fromTime + ' - ' + station.localServiceStaff.availability.monday.toTime : undefined,
                                tuesday: station.localServiceStaff.availability.tuesday ? station.localServiceStaff.availability.tuesday.fromTime + ' - ' + station.localServiceStaff.availability.tuesday.toTime : undefined,
                                wednesday: station.localServiceStaff.availability.wednesday ? station.localServiceStaff.availability.wednesday.fromTime + ' - ' + station.localServiceStaff.availability.wednesday.toTime : undefined,
                                thursday: station.localServiceStaff.availability.thursday ? station.localServiceStaff.availability.thursday.fromTime + ' - ' + station.localServiceStaff.availability.thursday.toTime : undefined,
                                friday: station.localServiceStaff.availability.friday ? station.localServiceStaff.availability.friday.fromTime + ' - ' + station.localServiceStaff.availability.friday.toTime : undefined,
                                saturday: station.localServiceStaff.availability.saturday ? station.localServiceStaff.availability.saturday.fromTime + ' - ' + station.localServiceStaff.availability.saturday.toTime : undefined,
                                sunday: station.localServiceStaff.availability.sunday ? station.localServiceStaff.availability.sunday.fromTime + ' - ' + station.localServiceStaff.availability.sunday.toTime : undefined,
                            },
                            services: {
                                parking: station.hasParking,
                                localPublicTransport: station.hasBicycleParking,
                                carRental: station.hasCarRental,
                                taxi: station.hasTaxiRank,
                                publicFacilities: station.hasPublicFacilities,
                                travelNecessities: station.hasTravelNecessities,
                                locker: station.hasLockerSystem,
                                wifi: station.hasWiFi,
                                information: station.hasTravelCenter,
                                railwayMission: station.hasRailwayMission,
                                lostAndFound: station.hasLostAndFound,
                                barrierFree: (station.hasSteplessAccess === true || station.hasSteplessAccess === 'yes'),
                                mobilityService: station.hasMobilityService,
                            },
                            ids: {
                                eva: station.evaNumbers[0].number,
                                ril: station.ril100Identifiers.map((/** @type {{ rilIdentifier: any; }} */ ril) => ril.rilIdentifier),
                                stada: station.number,
                            },
                            sources: [
                                {
                                    name: 'DB Stada',
                                    url,
                                    timestamp: new Date().toISOString()
                                }
                            ]
                        }
                        
                        if (!outputAsFile) {
                            fileService.writeFile(path, newStation.id + '.json', JSON.stringify(newStation, undefined, '\t'));
                        } else {
                            newStations.push(newStation);
                        }
                        cliService.printProgress(i++, response.result.length, newStation.name);
                    } catch (error) {
                        cliService.printError(true, `Failed to parse ${station.id} (${error})`);
                    }
                }
                if (outputAsFile) {
                    fileService.writeFile(undefined, path || '', JSON.stringify(newStations, undefined, '\t'));
                }
                cliService.printFinish('stations', response.result.length);
            })
    }
}

/**************
*   General   *
**************/

const fileService = new FileService();
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
        expect: 1
    },
    {
        name: "beginnScoreMatching() should score second entry",
        execute: () => searchService.beginnScoreMatching('Karlsruhe', { searchName: 'Karlsruhe Hbf', score: 1 }, { searchName: 'Leipzig Karlsruher Straße', score: 0 }),
        expect: 1
    }
]

const commands = {
    download: {
        'DB/Stada': { 
            function: downloadService.downloadApiDBStada,
            usage: 'download DB/Stada <client-id> <api-key> [path|file]',
            description: 'Downloads station from the DB Stada API to multible or a single file'
        }
    },
    test: { 
        function: () => new TestService().test(),
        usage: 'test',
        description: 'Runs all tests'
    }
}

new CliService().executeCommand();