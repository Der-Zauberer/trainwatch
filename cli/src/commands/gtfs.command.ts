import Surreal, { ConnectOptions, RecordId } from "surrealdb"
import { Logger, printError } from "../core/cli"
import { normalize } from "../core/search"
import { Entity, Operator, Route, Stop, Type } from "../core/types"
import { GtfsService } from "../services/gtfs.service"

export async function importGtfs(directory: string) {
    if (!directory) printError(`Require directory as arguments!`)
    const logger = new Logger('GTFS-Import')

    const options: ConnectOptions = {
        namespace: 'pis.derzauberer.eu',
        database: 'gtfs',
        auth: {
            username: 'admin',
		    password: 'admin'
        }
    }

    logger.printLoading(`Connect to database ${options.namespace} ${options.database}`)

    const surreal = new Surreal()
    await surreal.connect('ws://localhost:8080/rpc', options)

    const types: Map<string, Type> = await downloadFromSurreal(surreal, 'type')

    logger.printLoading(`Importing GTFS data from ${directory}`)

    const gtfsService = new GtfsService(directory)

    logger.printLoading(`Collecting stop information`)

    const stops = new Map<string, Stop>()
    
    for (const stop of gtfsService.stops) {
        const id: string = normalize(stop.stop_name, '_')
        const gtfsIdArray: string[] = stop.stop_id.split(':')
        const uic: string | undefined = gtfsIdArray[2] !== undefined && gtfsIdArray[2].length === 7 ? gtfsIdArray[2] : undefined
        const platform: string |undefined = gtfsIdArray[4] || stop.platform_code || undefined
        const existingStop: Stop | undefined = stops.get(id)
    
        if (existingStop && platform) {
            existingStop?.platforms?.push({ name: platform, height: 0, length: 0, linkedPlatforms: [] })
            existingStop?.platforms?.sort((a, b) => a.name.localeCompare(b.name))
            stops.set(id, existingStop)
        } else {
            stops.set(id, {
                id: new RecordId('stop', id),
                name: stop.stop_name,
                score: 9,
                platforms: platform ? [{ name: platform, height: 0, length: 0, linkedPlatforms: [] }] : [],
                location: {
                    latitude: Number(stop.stop_lat),
                    longitude: Number(stop.stop_lon)
                },
                services: {
                    parking: false,
                    localPublicTransport: false,
                    carRental: false,
                    taxi: false,
                    publicFacilities: false,
                    travelNecessities: false,
                    locker: false,
                    wifi: false,
                    information: false,
                    railwayMission: false,
                    lostAndFound: false,
                    barrierFree: false,
                    mobilityService: '',
                },
                ids: uic ? { uic } : undefined,
                sources: []
            })
        }
    }

    logger.printLoading(`Upload stops to surrealdb`)

    const stopArrays = splitArray(Array.from(stops.values()), 100)
    for (const [index, stopArray] of stopArrays.entries()) {
        await uploadToSurreal(surreal, 'stop', stopArray)
        logger.printProgress(index, stopArrays.length, 'Uploading gtfs stops')
    }

    logger.printLoading(`Collecting agency information`)

    const operator: Map<string, Operator> = new Map(gtfsService.agencies.map(agency => [
        agency.agency_id,
        {
            id: new RecordId('operator', normalize(agency.agency_name, '_')),
            name: agency.agency_name,
            address: agency.agency_phone ? { phone: agency.agency_phone }: {},
            website: agency.agency_url,
        }
    ]))

    logger.printLoading(`Upload operators to surrealdb`)

    const operatorArrays = splitArray(Array.from(operator.values()), 100)
    for (const [index, operatorArray] of operatorArrays.entries()) {
        await uploadToSurreal(surreal, 'operator', operatorArray)
        logger.printProgress(index, operatorArrays.length, 'Uploading gtfs agencies')
    }

    logger.printLoading(`Collecting route information`)

    const routes: Map<string, Route> = new Map(gtfsService.routes.map(route => [ 
        route.route_id,
        {
            name: route.route_long_name,
            designations: [
                {
                    type: new RecordId('type', types.get((splitDesignation(route.route_short_name).type || route.route_desc || 'B').toLowerCase())?.id.id.toString() || 'b'),
                    number: splitDesignation(route.route_short_name).number
                }
            ],
            operator: operator.get(route.agency_id)?.id
        } as unknown as Route
    ]))

    logger.printLoading(`Upload routes to surrealdb`)

    for (const [index, route] of Array.from(routes.values()).entries()) {
        await surreal.insert('route', route)
        logger.printProgress(index, routes.size, 'Uploading gtfs routes')
    }

}

async function downloadFromSurreal<T extends Entity>(surreal: Surreal, type: string): Promise<Map<string, T>> {
    return await surreal.select<T>(type)
        .then(results => new Map(results.map(result => [result.id.id.toString(), result])))
        .catch(error => printError(error)) as unknown as Promise<Map<string, T>>
}

async function uploadToSurreal<T>(surreal: Surreal, type: string, entities: T): Promise<T> {
    const entity = JSON.stringify(entities).replaceAll(type + ':', '')
    const query = `INSERT INTO ${type} ${entity} ON DUPLICATE KEY UPDATE id = id;`
    return await surreal.query<T[][]>(query)
        .then(result => result[0])
        .catch(error => printError(error + ' ' + entity)) as unknown as Promise<T>
}

function splitArray<T>(array: T[], size: number): T[][] {
    return [...Array(Math.ceil(array.length / size))].map((_, i) => array.slice(i * size, (i + 1) * size));
}

function splitDesignation(string: string): { type?: string, number: string } {
    const designation: { type?: string, number: string } = { number: '' }
    let isNumber = false
    for (const char of string) {
        if (isNaN(char as unknown as number) && !isNumber) {
            if (!designation.type) {
                designation.type = ''
            }
            designation.type += char
        } else {
            isNumber = true
            designation.number += char
        }
    }
    return designation
}