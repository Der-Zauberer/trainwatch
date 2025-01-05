//@ts-check
const { executeCommand, Logger, printWarning, printError, SEARCH, FILES } = require('./clilib')
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
    updated
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
        const logger = new Logger('DB/Stada', 'stations')
        printError(`Require client-id, api-key and file as arguments!`, !clientId || !apikey || !file)
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
                logger.printProgress(i++, response.result.length, 'Downloading', station.id)
            } catch (error) {
                printError(`Failed to parse ${station.id} (${error})`)
            }
        }
        logger.printFinish('downloaded', response.result.length)
        FILES.write(file, Array.from(stations.values()))
    }

    /**
     * @param { string } clientId
     * @param { string } apikey
     * @param { string } file
     */
    downloadApiDBRisStationsPlatform = async (clientId, apikey, file) => {
        const logger = new Logger('DB/Ris::Stations', 'stations')
        printError(`Require client-id, api-key and file as arguments!`, !clientId || !apikey || !file)
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
                logger.printProgress(i++, stations.size, 'Downloading', station.id)
                await new Promise(resolve => setTimeout(resolve, 110))
                if (i == 3) break
            } catch(error) {
                printWarning(error)
            }
        }
        logger.printFinish('downloaded', i)
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

/**************
*   General   *
**************/

const downloadService = new DownloadService()

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
    }
}

executeCommand(commands)