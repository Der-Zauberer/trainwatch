//@ts-check

const { executeCommand, test, Logger, printWarning, printError } = require('./clilib')
const FileSystem = require('node:fs')
const Path = require('path')

/************
*   Types   *
************/

class Entity {
    /** @type { string } */
    id
    /** @type { string } */
    name
    /** @type { Source[] | undefined } */
    sources
}

class Source {
    /** @type { string } */
    name
    /** @type { string } */
    license
    /** @type { string } */
    url
    /** @type { string } */
    used
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
        return FileSystem.readFileSync(path ? Path.join(path, name) : name, 'utf8')
    }

    /**
     * @param { string | undefined } path
     * @param { string } name
     * @param { string } content
     */
    writeFile(path, name, content) {
        const filePath = path ? Path.join(path, name) : name
        const directory = Path.dirname(filePath)
        if (directory && !FileSystem.existsSync(directory)) FileSystem.mkdirSync(directory)
        FileSystem.writeFileSync(filePath, content, 'utf8')
    }

    /**
     * @param { String } path 
     * @param { Logger } logger
     * @returns { Map<string, Entity> }
     */
    loadEntities(path, logger) {
        const pathAsFile = path?.endsWith('.json')
        const entities = new Map()
        if (pathAsFile) {
            logger.printLoading(`Reading ${logger.type} from file`)
            try {
                JSON.parse(this.readFile(undefined, path)).forEach(entity => entities.set(entity.id, entity))
            } catch (error) {}
        } else {
            let i = 1
            const files = FileSystem.readdirSync(path).filter(file => file.endsWith('json'))
            try {
                for (const file of files) {
                    logger.printProgress(i++, files.length, 'Reading', file.substring(file.length - 'json'.length))
                    try {
                        JSON.parse(this.readFile(path, file)).forEach(entity => entities.set(entity.id, entity))
                    } catch (error) {}
                }
                logger.printFinish('Read', entities.size)
            } catch (error) {}
        }
        return entities
    }

    /**
     * @param { Map<string, Entity> } entities
     * @param { string } path 
     * @param { Logger } logger
     */
    saveEntities(entities, path, logger) {
        const pathAsFile = path?.endsWith('.json')
        if (pathAsFile) {
            logger.printLoading(`Writing ${logger.type} to file`)
            const content = Array.from(entities.values()).sort((a, b) => a.name.localeCompare(b.name))
            this.writeFile(undefined, path || '', JSON.stringify(content, undefined, '\t'))
        } else {
            let i = 1
            for (const [id, entity] of entities) {
                logger.printProgress(i++, entities.size, 'Writing', id)
                this.writeFile(path, id + '.json', JSON.stringify(entity, undefined, '\t'))
            }
        }
        logger.printFinish('written', entities.size)
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
    }

    /**
     * @param { { [key: string]: string | number | string[] | number[] } } object
     * @returns { string[] }
     */
    extractIds(object) {
        const ids = []
        // @ts-ignore
        // @ts-ignore
        for (const [key, value] of Object.entries(object)) {
            if (Array.isArray(value)) {
                value.forEach(id => ids.push(id.toString().toLowerCase()))
            } else {
                ids.push(value.toString().toString().toLowerCase())
            }
        }
        return ids
    }

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
    }
    
    /**
     * @param { string } search
     * @param {{ search: string score: number }} a
     * @param {{ search: string score: number }} b
     */
    beginnScoreMatching(search, a, b) {
        const size = (number) => number === 0 ? 1 : Math.floor(Math.log10(number)) + 1
        if (size(a.score) !== size(b.score)) return a.score - b.score
        const aStartsWithName = a.search.startsWith(search)
        const bStartsWithName = b.search.startsWith(search)
        if (aStartsWithName && !bStartsWithName) return -1
        else if (!aStartsWithName && bStartsWithName) return 1
        else return a.score - b.score
    }

    /**
     * @param { string } search
     * @param { { search: string score: number }[] } entities
     */
    sortBeginnScoreMatching(search, entities) {
        return entities.sort((a, b) => this.beginnScoreMatching(search, a, b))
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
    downloadApiDBStada = (clientId, apikey, path) => {
        const logger = new Logger('DB/Stada', 'stations')
        printError(`Require client-id, api-key and path as arguments!`, !clientId || !apikey || !path)
        const url = 'https://apis.deutschebahn.com/db-api-marketplace/apis/station-data/v2/stations'
        const headers = { 'DB-Client-Id': clientId, 'DB-Api-Key': apikey }
        const stations = fileService.loadEntities(path, logger)
        logger.printLoading(`Downloading stations from ${url}`)
        fetch(url, { headers })
            .then(response => (logger.printLoading('Parsing stations'), response))
            .then(response => response.ok ? response.json() : Promise.reject())
            .then(response => {
                let i = 1
                for (const station of response.result) {
                    try {
                        if (station.evaNumbers.length == 0) {
                            i++
                            continue
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
                                ril: station.ril100Identifiers.map((/** @type {{ rilIdentifier: any }} */ ril) => ril.rilIdentifier),
                                stada: station.number,
                            }
                        }
                        const source = {
                            name: 'DB Ris::Stations (Platforms)',
                            license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
                            url,
                            used: new Date().toISOString().split('T')[0]
                        }
                        const mergedStation = { sources: [], ...stations.get(newStation.id), ...newStation }
                        stations.set(newStation.id, this.addSource( mergedStation, source))
                        logger.printProgress(i++, response.result.length, 'Downloading', station.id)
                    } catch (error) {
                        printError(`Failed to parse ${station.id} (${error})`)
                    }
                }
                logger.printFinish('downloaded', response.result.length)
                fileService.saveEntities(stations, path, logger)
            })
    }

    /**
     * @param { string } clientId
     * @param { string } apikey
     * @param { string } path
     */
    downloadApiDBRisStationsPlatform = async (clientId, apikey, path) => {
        const logger = new Logger('DB/Ris::Stations', 'stations')
        printError(`Require client-id, api-key and path as arguments!`, !clientId || !apikey || !path)
        const headers = { 'DB-Client-Id': clientId, 'DB-Api-Key': apikey }
        const stations = fileService.loadEntities(path, logger)
        const stationQueue = Array.from(stations.keys())
        logger.printLoading(`Downloading stations from https://apis.deutschebahn.com/db-api-marketplace/apis/ris-stations/v1/platforms`)
        let i = 1
        for (const [id, station] of stations) {
            // @ts-ignore
            const eva = station?.ids?.eva
            if (!eva) return
            try {
                const url = `https://apis.deutschebahn.com/db-api-marketplace/apis/ris-stations/v1/platforms/${eva}`
                const response = await fetch(url, { headers }).then(response => response.ok ? response.json() : Promise.reject())
                const platforms = []
                for (const platform of response.platforms) {
                    const heights = platform.heights
                    const lengthMap = heights.reduce((accumulator, { start, end, height }) => {
                        const length = end - start
                        accumulator[height] = (accumulator[height] || 0) + length
                        return accumulator
                    }, {})
                    const height = +Object.keys(lengthMap).reduce((a, b) => 
                        lengthMap[a] > lengthMap[b] ? a : b
                    )
                    platforms.push({
                        name: platform.name,
                        length: platform.length || 0,
                        height,
                        linkedPlatforms: platform.linkedPlatforms
                    })
                }
                // @ts-ignore
                station.platforms = platforms
                const source = {
                    name: 'DB Ris::Stations (Platforms)',
                    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
                    url,
                    used: new Date().toISOString().split('T')[0]
                }
                stations.set(station.id, this.addSource(station, source))
                logger.printProgress(i++, stations.size, 'Downloading', station.id)
                await new Promise(resolve => setTimeout(resolve, 110))
                if (i == 3) break
            } catch(error) {
                printWarning(error)
            }
        }
        logger.printFinish('downloaded', i)
        fileService.saveEntities(stations, path, logger)
    }

    /**
     * 
     * @param { Entity } entity
     * @param { Source } source
     * @returns { Entity }
     */
    addSource(entity, source) {
        if (!entity.sources) entity.sources = []
        entity.sources = entity.sources.filter(entry => entry.name !== source.name)
        entity.sources.push(source)
        return entity
    }

}

/**************
*   General   *
**************/

const fileService = new FileService()
const searchService = new SearchService()
const downloadService = new DownloadService()

const tests = [
    {
        name: "normalize() should return without seperator",
        execute: () => searchService.normalize(' Fäßchen/Brücken-Straße (Brötchen)Compañía '),
        expect: 'faesschenbrueckenstrassebroetchencompania'
    },
    {
        name: "normalize() should return with blank seperator",
        execute: () => searchService.normalize(' Fäßchen/Brücken-Straße (Brötchen)Compañía ', ' '),
        expect: 'faesschen bruecken strasse broetchen compania'
    },
    {
        name: "normalize() should return with underscore seperator",
        execute: () => searchService.normalize(' Fäßchen/Brücken-Straße (Brötchen)Compañía ', '_'),
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
            execute: downloadService.downloadApiDBStada,
            usage: 'download DB/Stada <client-id> <api-key> [path|file]',
            description: 'Downloads station from the DB Stada API to multible or a single file'
        },
        'DB/RIS/Stations': { 
            execute: downloadService.downloadApiDBRisStationsPlatform,
            usage: 'download DB/RIS/Stations <client-id> <api-key> [path|file]',
            description: 'Downloads platforms for already downloaded stations from the DB Ris::Stations API to multible or a single file'
        }
    },
    test: { 
        execute: () => test(tests),
        usage: 'test',
        description: 'Runs all tests'
    }
}

executeCommand(commands)