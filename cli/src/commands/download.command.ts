import { RecordId } from "surrealdb"
import { Logger, printError, printWarning } from "../core/cli"
import { readFileOrUndefined, writeFile } from "../core/files"
import { normalize } from "../core/search"
import { Source, Stop } from "../core/types"
import { getConfig } from "../core/config"

export async function downloadApiDBStada(file: string) {
    const logger = new Logger('DB/Stada')
    const config = getConfig()
    if (!file) printError(`Require the file as arguments!`)
    const url = 'https://apis.deutschebahn.com/db-api-marketplace/apis/station-data/v2/stations'
    const headers = { 'DB-Client-Id': config.dbMarketplace.clientId, 'DB-Api-Key': config.dbMarketplace.apiKey }
    const stops: Map<string, Stop> = new Map(JSON.parse(readFileOrUndefined(file) || '[]').map((value: { id: string }) => [value.id, value]))
    logger.printLoading(`Downloading stops from ${url}`)
    const response = await fetch(url, { headers })
        .then(response => (logger.printLoading('Parsing stops'), response))
        .then(response => response.ok ? response.json() : Promise.reject())
    let i = 1
    for (const stop of response.result) {
        try {
            if (stop.evaNumbers.length == 0) {
                i++
                continue
            }
            const newStop: Stop = {
                id: new RecordId('stop', normalize(stop.name, '_')),
                name: stop.name,
                score: stop.category,
                platforms: [],
                location: false ? { latitude: 0, longitude: 0 } : {
                    latitude: stop.evaNumbers[0].geographicCoordinates.coordinates[1],
                    longitude: stop.evaNumbers[0].geographicCoordinates.coordinates[0]
                },
                address: {
                    street: stop.mailingAddress.street.replace('str.', 'straße').replace('  ', ' '),
                    zipcode: stop.mailingAddress.zipcode,
                    city: stop.mailingAddress.city,
                    federalState: stop.federalState,
                    country: 'Deutschland'
                },
                open: !stop.localServiceStaff || !stop.localServiceStaff.availability ? {} : {
                    monday: stop.localServiceStaff.availability.monday ? stop.localServiceStaff.availability.monday.fromTime + ' - ' + stop.localServiceStaff.availability.monday.toTime : undefined,
                    tuesday: stop.localServiceStaff.availability.tuesday ? stop.localServiceStaff.availability.tuesday.fromTime + ' - ' + stop.localServiceStaff.availability.tuesday.toTime : undefined,
                    wednesday: stop.localServiceStaff.availability.wednesday ? stop.localServiceStaff.availability.wednesday.fromTime + ' - ' + stop.localServiceStaff.availability.wednesday.toTime : undefined,
                    thursday: stop.localServiceStaff.availability.thursday ? stop.localServiceStaff.availability.thursday.fromTime + ' - ' + stop.localServiceStaff.availability.thursday.toTime : undefined,
                    friday: stop.localServiceStaff.availability.friday ? stop.localServiceStaff.availability.friday.fromTime + ' - ' + stop.localServiceStaff.availability.friday.toTime : undefined,
                    saturday: stop.localServiceStaff.availability.saturday ? stop.localServiceStaff.availability.saturday.fromTime + ' - ' + stop.localServiceStaff.availability.saturday.toTime : undefined,
                    sunday: stop.localServiceStaff.availability.sunday ? stop.localServiceStaff.availability.sunday.fromTime + ' - ' + stop.localServiceStaff.availability.sunday.toTime : undefined,
                },
                services: {
                    parking: stop.hasParking,
                    localPublicTransport: stop.hasBicycleParking,
                    carRental: stop.hasCarRental,
                    taxi: stop.hasTaxiRank,
                    publicFacilities: stop.hasPublicFacilities,
                    travelNecessities: stop.hasTravelNecessities,
                    locker: stop.hasLockerSystem,
                    wifi: stop.hasWiFi,
                    information: stop.hasTravelCenter,
                    railwayMission: stop.hasRailwayMission,
                    lostAndFound: stop.hasLostAndFound,
                    barrierFree: (stop.hasSteplessAccess === true || stop.hasSteplessAccess === 'yes'),
                    mobilityService: stop.hasMobilityService,
                },
                ids: {
                    uic: stop.evaNumbers[0].number,
                    ril: stop.ril100Identifiers.map((ril: { rilIdentifier: any }) => ril.rilIdentifier),
                    stada: stop.number,
                },
                sources: []
            }
            const source = {
                name: 'DB Ris::Stations (Platforms)',
                license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
                url,
                updated: new Date().toISOString().split('T')[0]
            }
            const mergedStop: Stop = { ...stops.get(newStop.id.id.toString()), ...newStop }
            stops.set(newStop.id.id.toString(), addSource(mergedStop, source))
            logger.printProgress(i++, response.result.length, 'Downloading stops', stop.id)
        } catch (error) {
            printError(`Failed to parse ${stop.id} (${error})`)
        }
    }
    logger.print(`Downloaded ${response.result.length} stops`, true)
    writeFile(file, Array.from(stops.values()))
}


export async function downloadApiDBRisStationsPlatform(file: string) {
    const logger = new Logger('DB/Ris::Stations')
    const config = getConfig()
    if (!file) printError(`Require the file as arguments!`)
    const headers = { 'DB-Client-Id': config.dbMarketplace.clientId, 'DB-Api-Key': config.dbMarketplace.apiKey }
    const stops: Map<string, Stop> = new Map(JSON.parse(readFileOrUndefined(file) || '[]').map((value: { id: string }) => [value.id, value]))
    logger.printLoading(`Downloading stops from https://apis.deutschebahn.com/db-api-marketplace/apis/ris-stations/v1/platforms`)
    let i = 1
    for (const [id, stop] of stops) {
        const uic = stop.ids?.uic
        if (!uic) return
        try {
            const url = `https://apis.deutschebahn.com/db-api-marketplace/apis/ris-stations/v1/platforms/${uic}`
            const response = await fetch(url, { headers }).then(response => response.ok ? response.json() : Promise.reject())
            const platforms = []
            for (const platform of response.platforms) {
                const heights = platform.heights
                const lengthMap = heights.reduce((accumulator: { [x: string]: any }, { start, end, height }: any) => {
                    const length = end - start
                    accumulator[height] = (accumulator[height] || 0) + length
                    return accumulator
                }, {})
                const height =+ Object.keys(lengthMap).reduce((a, b) => 
                    lengthMap[a] > lengthMap[b] ? a : b
                )
                platforms.push({
                    name: platform.name,
                    length: platform.length || 0,
                    height,
                    linkedPlatforms: platform.linkedPlatforms
                })
            }
            stop.platforms = platforms
            const source = {
                name: 'DB Ris::Stations (Platforms)',
                license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
                url,
                updated: new Date().toISOString().split('T')[0]
            }
            stops.set(stop.id.id.toString(), addSource(stop, source))
            logger.printProgress(i++, stops.size, 'Downloading stops platforms', stop.id)
            await new Promise(resolve => setTimeout(resolve, 110))
            if (i == 3) break
        } catch(error) {
            printWarning(error)
        }
    }
    logger.print(`Downloaded ${i} stops`, true)
    writeFile(file, Array.from(stops.values()))
}

function addSource(stop: Stop, source: Source): Stop {
    if (!stop.sources) stop.sources = []
    stop.sources = stop.sources.filter(source => source.name !== source.name)
    stop.sources.push(source)
    return stop
}