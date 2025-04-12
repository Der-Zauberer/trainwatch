import Surreal, { ConnectOptions, RecordId } from "surrealdb"
import { Logger, printError, printWarning } from "../core/cli"
import { Entity, Line, LineCreation, Operator, Route, RouteCreation, Stop, Timetable, Type } from "../core/types"
import { GtfsService, GtfsStop, GtfsStopTime } from "../services/gtfs.service"
import { readFileAsStream } from "../core/files"
import Path from 'path'
import { CSV } from "../core/csv"
import { normalize } from "../core/search"

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

    const timetable: Timetable = await surreal.upsert<Timetable, Partial<Timetable>>(new RecordId('timetable', normalize(directory)), { name: directory })

    logger.printLoading(`Importing GTFS data from ${directory}`)
    const gtfsService = new GtfsService(directory)

    logger.printLoading(`Collecting stop information`)
    const stops: Map<string, Stop> = new Map()//gtfsService.convertStops()

    logger.printLoading(`Upload stops to surrealdb`)

    const stopArrays = splitArray(Array.from(stops.values()), 100)
    for (const [index, stopArray] of stopArrays.entries()) {
        await uploadToSurreal(surreal, 'stop', stopArray)
        logger.printProgress(index, stopArrays.length, 'Uploading gtfs stops')
    }

    logger.printLoading(`Collecting agency information`)
    const operator: Map<string, Operator> = gtfsService.convertAgencies()

    logger.printLoading(`Upload operators to surrealdb`)

    const operatorArrays = splitArray(Array.from(operator.values()), 100)
    for (const [index, operatorArray] of operatorArrays.entries()) {
        await uploadToSurreal(surreal, 'operator', operatorArray)
        logger.printProgress(index, operatorArrays.length, 'Uploading gtfs agencies')
    }

    logger.printLoading(`Collecting route information`)
    const routesCreations: Map<string, RouteCreation> = gtfsService.convertRoutes(timetable, types, operator)

    logger.printLoading(`Upload routes to surrealdb`)

    const routes: Map<string, Route> = new Map()
    for (const [index, [id, route]] of Array.from(routesCreations.entries()).entries()) {
        routes.set(id, await surreal.insert<Route, RouteCreation>('route', route).then(result => result[0]))
        logger.printProgress(index, routesCreations.size, 'Uploading gtfs routes')
    }

    logger.printLoading(`Collecting trip information`)
    const lineCreations: Map<string, LineCreation> = gtfsService.convertTrips(routes)

    logger.printLoading(`Upload trips to surrealdb`)

    const lines: Map<string, Line> = new Map()
    for (const [index, [id, line]] of Array.from(lineCreations.entries()).entries()) {
        lines.set(id, await surreal.insert<Line, LineCreation>('line', line).then(result => result[0]))
        logger.printProgress(index, lineCreations.size, 'Uploading gtfs trips')
    }
    console.log(lines)

    logger.printLoading(`Collecting timetable information`)

    const stop_ids: Map<string, GtfsStop> = new Map(gtfsService.stops.map(stop => [ stop.stop_id, stop ]))

    let header: string[]
    let index = 0
    readFileAsStream(Path.join(directory, 'stop_times.txt'), async (lineArray) => {
        if (!header) header = CSV.parseHeader(lineArray.shift() || '')
        for (const connects of CSV.parseChunk(header, lineArray) as GtfsStopTime[]) {
            const stop: GtfsStop | undefined = stop_ids.get(connects.stop_id)
            const line: Line | undefined = lines.get(connects.trip_id)
            if (!stop) {
                printWarning(`Stop ${connects.stop_id} not found`)
                continue
            }
            if (!line) {
                printWarning(`Line ${connects.trip_id} not found`)
                continue
            }
            await surreal.insertRelation({
                in: line,
                out: stops.get(connects.stop_id)?.id,
                arrival: {
                    platform: stop.platform_code,
                    time: connects.arrival_time.split(':').map(time => time.padStart(2, '0')).slice(0, 2).join(':')
                },
                departure: {
                    platform: stop.platform_code,
                    time: connects.departure_time.split(':').map(time => time.padStart(2, '0')).slice(0, 2).join(':')
                }
            })
        }
        logger.printProgress(index++, Math.ceil(50564128 / 1000), 'reading', 'stop_times')
    }, 1000)

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