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

class Entity {
    /** @type { string } */
    id;
    /** @type { string } */
    name;
}

/**********
*   Cli   *
**********/

class CliService {

    static CLI_RESET = '\x1b[0m';
    static CLI_GREY = '\x1b[90m';
    static CLI_RED = '\x1b[31m';
    static CLI_YELLOW = '\x1b[33m';
    static CLI_GREEN = '\x1b[32m';
    static CLI_BLUE = '\x1b[36m';

    /** @type { string | undefined } */
    #name;

    /** @type { string | undefined } */
    #type;

    /** @type { (() => void) | undefined } */
    #removeTemporaryLastLine = undefined;
    /** @type { (() => void) | undefined } */
    #stopLoading = undefined;

    /**
     * @param { string } [name] 
     * @param { string } [type] 
     */
    constructor(name, type) {
        this.#name = name;
        this.#type = type;
    }

    get name() { return this.#name }
    get type() { return this.#type }

    executeCommand() {
        let branch = commands;
        let args = process.argv.slice(2);
        do {
            this.printError(args.length === 0, `Not enough arguments! Possible arguments: ${Object.keys(branch)}`);
            if (args[0] === 'help') {
                for (const entry of this.#getHelp(branch)) {
                    console.log(`${entry.usage} ${CliService.CLI_GREY}${entry.description}${CliService.CLI_RESET}`)
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
     * @returns { string }
     */
    #constructName() {
        return `${CliService.CLI_BLUE}[${this.#name}]${CliService.CLI_RESET}`;
    }

    /**
     * @param { string } message
     * @param { any } [response]
     * @returns { any }
     */
    print(message, response) {
        this.#removeTemporaryLastLine?.();
        this.#stopLoading?.();
        console.log(`${this.#constructName()} ${message}`);
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
        console.log(`${this.#constructName()} ${message}`);
        const logLoading = (/** @type {number} */ count) => {
            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine(1);
            console.log(`${this.#constructName()} ${message} ${'.'.repeat(count)}`);
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
     * @param { string } progressiveVerb
     * @param { string } name
     * @param { any } [response]
     * @returns { any }
     */
    printProgress(index, amount, progressiveVerb, name, response) {
        this.#removeTemporaryLastLine?.();
        this.#stopLoading?.();
        console.log(`${this.#constructName()} ${ ((index / amount) * 100).toFixed(0) }% (${index}/${amount}) ${progressiveVerb} ${this.#type} ${name}`);
        this.#removeTemporaryLastLine = () => {
            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine(1);
            this.#removeTemporaryLastLine = undefined;
        }
        return response;
    }

    /**
     * @param { string } pastVerb
     * @param { number } amount
     */
    printFinish(pastVerb, amount) {
        this.#removeTemporaryLastLine?.();
        this.#stopLoading?.();
        console.log(`${this.#constructName()} Successfully ${pastVerb} ${amount ? amount + ' ' : ''}${this.#type}`);
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
     * @returns { string }
     */
    readFile(path, name) {
        return FileSystem.readFileSync(path ? Path.join(path, name) : name, 'utf8');
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

    /**
     * @param { FileSystem.PathLike } path
     */
    listDirectoryFiles(path) {
        return FileSystem.readdirSync(path);
    }

    /**
     * @param { String } path 
     * @param { CliService } cliService
     * @param { string } type
     * @returns { Map<string, Entity> }
     */
    loadEntities(path, cliService, type) {
        const pathAsFile = path?.endsWith('.json');
        const entities = new Map();
        if (pathAsFile) {
            cliService.printLoading(`Reading ${type} from file`);
            try {
                JSON.parse(path).forEach(entity => entities.set(entity.id, entity));
            } catch (error) {}
        } else {
            let i = 1
            const files = this.listDirectoryFiles(path).filter(file => file.endsWith('json'))
            try {
                for (const file of files) {
                    cliService.printProgress(i++, files.length, 'Reading', file.substring(file.length - 'json'.length));
                    try {
                        JSON.parse(this.readFile(path, file)).forEach(entity => entities.set(entity.id, entity));
                    } catch (error) {}
                }
                cliService.printFinish('Read', entities.size);
            } catch (error) {}
        }
        return entities;
    }

    /**
     * @param { Map<string, Entity> } entities
     * @param { string } path 
     * @param { CliService } cliService
     */
    saveEntities(entities, path, cliService) {
        const pathAsFile = path?.endsWith('.json');
        if (pathAsFile) {
            cliService.printLoading(`Writing ${cliService.type} to file`);
            this.writeFile(undefined, path || '', JSON.stringify(entities, undefined, '\t'));
        } else {
            let i = 1
            for (const [id, entity] of entities) {
                cliService.printProgress(i++, entities.size, 'Writing', id);
                this.writeFile(path, id + '.json', JSON.stringify(entity, undefined, '\t'));
            }
            cliService.printFinish('written', entities.size);
        }
    }

}

/***********
*   Test   *
***********/

class TestService {

    test() {
        const WARMUP_CYCLES = 100;
        const EXECUTION_CYCLES = 5000;
        let passedCount = 0;
        let failedCount = 0;
        for (const test of tests) {
            try { 
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
                if (JSON.stringify(test.expect) === JSON.stringify(result)) {
                    console.log(`${CliService.CLI_GREEN}TEST PASSED:${CliService.CLI_RESET} ${test.name} (${average.toFixed(3)}µs)`);
                    passedCount++;
                } else {
                    console.log(`${CliService.CLI_RED}TEST FAILED:${CliService.CLI_RESET} ${test.name} (${average.toFixed(3)}µs)`);
                    console.log(`\tExpected: ${CliService.CLI_BLUE}${JSON.stringify(test.expect)}${CliService.CLI_RESET}`);
                    console.log(`\t  Result: ${CliService.CLI_RED}${CliService.CLI_RED}${JSON.stringify(result)}${CliService.CLI_RESET}`);
                    failedCount++;
                }
            } catch (error) {
                failedCount++;
                console.log(`${CliService.CLI_RED}TEST FAILED:${CliService.CLI_RESET} ${test.name}`);
                console.log(`\tError: ${CliService.CLI_RED}${error.stack.replaceAll('\n', '\n\t')}${CliService.CLI_RESET}`);
            }
        }
        console.log(`${CliService.CLI_GREEN}${passedCount}${CliService.CLI_RESET} tests passed, ${CliService.CLI_RED}${failedCount}${CliService.CLI_RESET} tests failed!`);
        if (failedCount > 0) process.exit(-1);
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
     * @param { { [key: string]: string | number | string[] | number[] } } object
     * @returns { string[] }
     */
    extractIds(object) {
        const ids = [];
        for (const [key, value] of Object.entries(object)) {
            if (Array.isArray(value)) {
                value.forEach(id => ids.push(id.toString().toLowerCase()))
            } else {
                ids.push(value.toString().toString().toLowerCase())
            }
        }
        return ids;
    }

    /**
     * @param { string } name 
     * @returns { string[] }
     */
    nWordEdgeNgram(name) {
        const parts = [];
        let currentName = ''
        for (let i = name.length -1; i >= 0; i--) {
            if (name[i] !== ' ') currentName = name[i] + currentName;
            else parts.unshift(currentName);
        }
        parts.unshift(currentName);
        const result = []
        for (const part of parts) {
            for (let i = 1; i <= part.length; i++) {
                result.push(part.slice(0, i));
            }
        }
        return result;
    }
    
    /**
     * @param { string } search
     * @param {{ search: string; score: number; }} a
     * @param {{ search: string; score: number; }} b
     */
    beginnScoreMatching(search, a, b) {
        const size = (number) => number === 0 ? 1 : Math.floor(Math.log10(number)) + 1;
        if (size(a.score) !== size(b.score)) return a.score - b.score;
        const aStartsWithName = a.search.startsWith(search);
        const bStartsWithName = b.search.startsWith(search);
        if (aStartsWithName && !bStartsWithName) return -1;
        else if (!aStartsWithName && bStartsWithName) return 1;
        else return a.score - b.score;
    }

    /**
     * @param { string } search
     * @param { { search: string; score: number; }[] } entities
     */
    sortBeginnScoreMatching(search, entities) {
        return entities.sort((a, b) => this.beginnScoreMatching(search, a, b));
    }

}

/***************
*   Download   *
***************/

class DownloadService {

    /**
     * @param { string } clientId
     * @param { string } apikey
     * @param { string } path
     */
    downloadApiDBStada(clientId, apikey, path) {
        const cliService = new CliService('DB/Stada', 'stations');
        cliService.printError(!clientId || !apikey, `Require client-id, api-key and path as arguments!`);
        const url = 'https://apis.deutschebahn.com/db-api-marketplace/apis/station-data/v2/stations'
        const headers = { 'DB-Client-Id': clientId, 'DB-Api-Key': apikey }
        const stations = fileService.loadEntities(path, cliService, 'stations')
        cliService.printLoading(`Downloading stations from ${url}`);
        fetch(url, { headers })
            .then(response => cliService.printLoading('Parsing stations', response))
            .then(response => response.ok ? response.json() : Promise.reject())
            .then(response => {
                let i = 1;
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
                            platforms: [],
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
                                    used: new Date().toISOString().split('T')[0]
                                }
                            ]
                        }
                        stations.set(newStation.id, { ...stations.get(newStation.id), ...newStation });
                        cliService.printProgress(i++, response.result.length, 'Downloading', station.id);
                    } catch (error) {
                        cliService.printError(true, `Failed to parse ${station.id} (${error})`);
                    }
                }
                cliService.printFinish('downloaded', response.result.length);
                fileService.saveEntities(stations, path, cliService)
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
        name: "extractIds() should extract ids",
        execute: () => searchService.extractIds({ eva: 8011160, stada: 1071, ril: [ 'BHBF', 'BL', 'BLS' ] }),
        expect: [ "8011160", "1071", 'bhbf', 'bl', 'bls' ]
    },
    {
        name: "beginnScoreMatching() should match first entry",
        execute: () => searchService.beginnScoreMatching('Karlsruhe', { search: 'Karlsruhe Hbf', score: 0 }, { search: 'Leipzig Karlsruher Straße', score: 0 }),
        expect: -1
    },
    {
        name: "beginnScoreMatching() should match second entry",
        execute: () => searchService.beginnScoreMatching('Karlsruhe', { search: 'Leipzig Karlsruher Straße', score: 0 }, { search: 'Karlsruhe Hbf', score: 0 }),
        expect: 1
    },
    {
        name: "beginnScoreMatching() should score second entry",
        execute: () => searchService.beginnScoreMatching('Karlsruhe', { search: 'Leipzig Karlsruher Straße', score: 0 }, { search: 'Karlsruhe Hbf', score: 1 }),
        expect: 1
    },
    {
        name: "beginnScoreMatching() should score second entry",
        execute: () => searchService.beginnScoreMatching('Karlsruhe', { search: 'Leipzig Karlsruher Straße', score: 1 }, { search: 'Karlsruhe Hbf', score: 0 }),
        expect: 1
    },
    {
        name: "beginnScoreMatching() should rank first entry",
        execute: () => searchService.beginnScoreMatching('Karlsruhe', { search: 'Karlsruhe Hbf', score: 10 }, { search: 'Leipzig Karlsruher Straße', score: 1 }),
        expect: 9
    },
    {
        name: "nWordEgeNgram() should return N-Word-Edge-Ngram",
        execute: () => searchService.nWordEdgeNgram('What why'),
        expect: ['W', 'Wh', 'Wha', 'What', 'Whatw', 'Whatwh', 'Whatwhy', 'w', 'wh', 'why']
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