//@ts-check

const { type } = require('os')
const { executeCommand, Logger, printWarning, printError, SEARCH, FILES, CSV } = require('./clilib')
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
    updated
}

/************
*   Utils   *
************/

const UTILS = {

    /**
     * @template T
     * @param { T[] } array
     * @param { number } size
     * @returns { T[][] }
     */
    split(array, size) {
        return [...Array(Math.ceil(array.length / size))].map((_, i) => array.slice(i * size, (i + 1) * size));
    },

    /**
     * @param {{ address: string, namespace: string, database: string, username: string, password: string }} target 
     * @param { string } body 
     * @returns { Promise<any[]> }
     */
    async surrealDb(target, body) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        const options = {
            method: 'POST',
            headers: {
                'surreal-ns': target.namespace,
                'surreal-db': target.database,
                'Accept': 'application/json',
                'Authorization': `Basic ${btoa(`${target.username}:${target.password}`)}`
            },
            signal: controller.signal,
            body
        }
        let response;
        try {
            response = await fetch(target.address, options);
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Request timed out`);
            } else {
                throw new Error(`${error.message}`);
            }
        }
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`${response.statusText}`);
        }
        const data = await response.json();
        if (data[0]?.status !== undefined && data[0].status !== 'OK') {
            throw new Error(`${data[0].result}`);
        }
        return data;
    },

}

/***************
*   Download   *
***************/

class DownloadService {

    /**
     * @param { string } clientId
     * @param { string } apikey
     * @param { string } file
     */
    downloadApiDBStada = async (clientId, apikey, file) => {
        const logger = new Logger('DB/Stada')
        if (!clientId || !apikey || !file) printError(`Require client-id, api-key and file as arguments!`)
        const url = 'https://apis.deutschebahn.com/db-api-marketplace/apis/station-data/v2/stations'
        const headers = { 'DB-Client-Id': clientId, 'DB-Api-Key': apikey }
        const stations = new Map(JSON.parse(FILES.readOrUndefined(file) || '[]').map(value => [value.id, value]))
        logger.printLoading(`Downloading stations from ${url}`)
        const response = await fetch(url, { headers })
            .then(response => (logger.printLoading('Parsing stations'), response))
            .then(response => response.ok ? response.json() : Promise.reject())
        let i = 1
        for (const station of response.result) {
            try {
                if (station.evaNumbers.length == 0) {
                    i++
                    continue
                }
                const newStation = {
                    id: SEARCH.normalize(station.name, '_'),
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
                    updated: new Date().toISOString().split('T')[0]
                }
                const mergedStation = { ...stations.get(newStation.id), ...newStation }
                stations.set(newStation.id, this.addSource( mergedStation, source))
                logger.printProgress(i++, response.result.length, 'Downloading stations', station.id)
            } catch (error) {
                printError(`Failed to parse ${station.id} (${error})`)
            }
        }
        logger.print(`Downloaded ${response.result.length} stations`, true)
        FILES.write(file, Array.from(stations.values()))
    }

    /**
     * @param { string } clientId
     * @param { string } apikey
     * @param { string } file
     */
    downloadApiDBRisStationsPlatform = async (clientId, apikey, file) => {
        const logger = new Logger('DB/Ris::Stations')
        if (!clientId || !apikey || !file) printError(`Require client-id, api-key and file as arguments!`)
        const headers = { 'DB-Client-Id': clientId, 'DB-Api-Key': apikey }
        const stations = new Map(JSON.parse(FILES.readOrUndefined(file) || '[]').map(value => [value.id, value]))
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
                    updated: new Date().toISOString().split('T')[0]
                }
                stations.set(station.id, this.addSource(station, source))
                logger.printProgress(i++, stations.size, 'Downloading station platforms', station.id)
                await new Promise(resolve => setTimeout(resolve, 110))
                if (i == 3) break
            } catch(error) {
                printWarning(error)
            }
        }
        logger.print(`Downloaded ${i} stations`, true)
        FILES.write(file, Array.from(stations.values()))
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

/***********
*   GTFS   *
***********/

class GtfsService {

    /**
     * @param { string } file
     */
    async import(file) {
        if (!file) printError(`Require file as arguments!`)
        const logger = new Logger('GTFS-Import')

        const surrealDb = {
            address: 'http://localhost:8080/sql',
            namespace: 'pis.derzauberer.eu',
            database: 'gtfs',
            username: 'admin',
            password: 'admin'
        }

        logger.printLoading(`Importing GTFS data from ${file}`)
        
        const agencyCsv = CSV.parse(FILES.read(Path.join(file, 'agency.txt')), ',')
        const routesCsv = CSV.parse(FILES.read(Path.join(file, 'routes.txt')), ',')
        const stopsCsv = CSV.parse(FILES.read(Path.join(file, 'stops.txt')), ',')
        const tripsCsv = CSV.parse(FILES.read(Path.join(file, 'trips.txt')), ',')
        
        logger.printLoading(`Indexing GTFS data`)
        
        const agencyIds = new Map(agencyCsv.map(agency => [agency.agency_id, agency]))
        const stopIds = new Map(stopsCsv.map(stop => [stop.stop_id, stop]))
        const routeIds = new Map(routesCsv.map(route => [route.route_id, route]))
        const tripIds = new Map(tripsCsv.map(trip => [trip.trip_id, trip]))

        logger.printLoading(`Collecting stop information`)

        const stops = new Map()

        for (const stop of stopsCsv) {
            const id = SEARCH.normalize(stop.stop_name, '_')
            const gtfsIdArray = stop.stop_id.split(':')
            const uic = gtfsIdArray[2] !== undefined && gtfsIdArray[2].length === 7 && !isNaN(gtfsIdArray[2]) ? Number(gtfsIdArray[2]) : undefined
            const platform = gtfsIdArray[4] || stop.platform_code || undefined
            const existingStop = stops.get(id)

            if (existingStop && platform) {
                existingStop.platforms.push({ name: platform, height: 0, length: 0, linkedPlatforms: [] })
                existingStop.platforms.sort((a, b) => a.name.localeCompare(b.name))
                stops.set(id, existingStop)
            } else {
                stops.set(id, {
                    id,
                    name: stop.stop_name,
                    platforms: platform ? [{ name: platform, height: 0, length: 0, linkedPlatforms: [] }] : [],
                    location: {
                        latitude: Number(stop.stop_lat),
                        longitude: Number(stop.stop_lon)
                    },
                    ids: uic ? { uic } : {},
                    sources: []
                })
            }
        }
        
        logger.printLoading(`Upload stops to surrealdb`)

        const stopArrays = UTILS.split(Array.from(stops.values()), 1000)
        for (const [index, stopArray] of stopArrays.entries()) {
            await UTILS.surrealDb(surrealDb, `INSERT INTO stop ${JSON.stringify(stopArray)} ON DUPLICATE KEY UPDATE id = id;`).catch(printWarning)
            logger.printProgress(index, stopArrays.length, 'Uploading gtfs stops')
        }

        logger.printLoading(`Collecting agency information`)

        const operators = agencyCsv.map(agency => ({
            id: SEARCH.normalize(agency.agency_name, '_'),
            name: agency.agency_name,
            address: agency.agency_phone ? { phone: agency.agency_phone }: {},
            website: agency.agency_url,
        }))

        logger.printLoading(`Upload operators to surrealdb`)

        const operatorArrays = UTILS.split(Array.from(operators.values()), 1000)
        for (const [index, operatorArray] of operatorArrays.entries()) {
            await UTILS.surrealDb(surrealDb, `INSERT INTO operator ${JSON.stringify(operatorArray)} ON DUPLICATE KEY UPDATE id = id;`).catch(printWarning)
            logger.printProgress(index, operatorArrays.length, 'Uploading gtfs operators')
        }

        logger.printLoading(`Collecting route information`)

        const types = new Map((await UTILS.surrealDb(surrealDb, `SELECT * FROM type;`)
            .then(result => result[0].result)
            .catch(printWarning)
        ).map(type => [type.id.split(':')[1], type.id]))

        const routes = routesCsv.map(route => {
            const designation = route.route_short_name.split(/(?<=[A-z]|^)(?=\d)/);
            return {
                name: route.route_long_name,
                designations: [
                    {
                        type: types.get(designation[0].toLowerCase()) || 'type:b',
                        number: designation[1] || '0'
                    }
                ],
                operator: `operator:${SEARCH.normalize(agencyIds.get(route.agency_id).agency_name), '_'}`
            }
        })

        logger.print(JSON.stringify(routes[0]).replace(/(?<="type":\s?)("[^"]+")/, '$1').replace(/(?<="operator": )("[^"]+")/, '$1'))

        logger.printLoading(`Upload routes to surrealdb`)

        const routesArrays = UTILS.split(Array.from(routes.values()), 1000)
        for (const [index, routesArray] of routesArrays.entries()) {
            await UTILS.surrealDb(surrealDb, `INSERT INTO route ${JSON.stringify(routesArray).replace(/(?<="type": )("[^"]+")/, '$1').replace(/(?<="operator": )("[^"]+")/, '$1')} ON DUPLICATE KEY UPDATE id = id;`).catch(printWarning)
            logger.printProgress(index, operatorArrays.length, 'Uploading gtfs routes')
        }

        return

        logger.printLoading(`Collecting line information`)
        
        const lines = new Map(tripsCsv.map(trip => [trip.trip_id, {
            id: trip.trip_id,
            name: trip.trip_short_name,
            headsign: trip.trip_headsign,
            route: {
                id: trip.route_id,
                name: routeIds.get(trip.route_id)?.route_short_name,
                long_name: routeIds.get(trip.route_id)?.route_long_name,
                agency_id: routeIds.get(trip.route_id)?.agency_id,
                agency_name: agencyIds.get(routeIds.get(trip.route_id)?.agency_id)?.agency_name,
                description: routeIds.get(trip.route_id)?.route_desc,
                color: routeIds.get(trip.route_id)?.route_color,
                textColor: routeIds.get(trip.route_id)?.route_text_color
            },
            /** @type { any[] } */stops: []
        }]))

        logger.printLoading(`Reading stop_times`)

        let header
        let index = 0
        FILES.readAsStream(Path.join(file, 'stop_times.txt'), (lineArray) => {
            if (!header) header = CSV.parseHeader(lineArray.shift() || '')
            for (const visit of CSV.parseChunk(header, lineArray)) {
                const stop = stopIds.get(visit.stop_id)
                const line = lines.get(visit.trip_id)
                if (!stop) {
                    printWarning(`Stop ${visit.stop_id} not found`)
                    continue
                }
                if (!line) {
                    printWarning(`Line ${visit.trip_id} not found`)
                    continue
                }
                line.stops.push({
                    id: visit.stop_id,
                    name: stop.stop_name,
                    arrival: visit.arrival_time.split(':').map(time => time.padStart(2, '0')).slice(0, 2).join(':'),
                    departure: visit.departure_time.split(':').map(time => time.padStart(2, '0')).slice(0, 2).join(':'),
                    platform: stop.platform_code
                })
            }
            logger.printProgress(index++, Math.ceil(50564128 / 1000), 'reading', 'stop_times')
        }, 1000)

        logger.printLoading(`Sorting stops`)
        
        for (const line of lines.values()) {
            line.stops = line.stops.sort((a, b) => a.arrival.localeCompare(b.arrival))
        }

        logger.printLoading(`Saving lines`)

        const lineArray = Array.from(lines.values())
        const chunkSize = Math.ceil(lineArray.length / 50);

        for (let i = 0; i < 50; i++) {
            const chunk = lineArray.slice(i * chunkSize, (i + 1) * chunkSize);
            FILES.write(Path.join('lines', `lines-${i + 1}.js`), chunk)
        }

        logger.print(`Processed ${lines.size} lines`)

    }

}

/**************
*   General   *
**************/

const downloadService = new DownloadService()
const gtfsService = new GtfsService()

const commands = {
    download: {
        'DB/Stada': { 
            execute: downloadService.downloadApiDBStada,
            usage: 'download DB/Stada <client-id> <api-key> [file]',
            description: 'Downloads station from the DB Stada API to multible or a single file'
        },
        'DB/RIS/Stations': { 
            execute: downloadService.downloadApiDBRisStationsPlatform,
            usage: 'download DB/RIS/Stations <client-id> <api-key> [file]',
            description: 'Downloads platforms for already downloaded stations from the DB Ris::Stations API to multible or a single file'
        }
    },
    gtfs: {
        import: {
            execute: gtfsService.import,
            usage: 'gtfs import <file>',
            description: 'Imports GTFS data from a CSV files'
        }
    }
}

executeCommand(commands)