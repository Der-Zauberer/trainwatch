import Surreal, { ConnectOptions, Gap, jsonify, RecordId, surql, Table } from "surrealdb"
import { Logger, printError, printWarning } from "../core/cli"
import { Connects, Entity, Line, Operator, Route, Stop, Timetable, Type } from "../core/types"
import { GtfsService, GtfsStop } from "../services/gtfs.service"
import { guid, normalize } from "../core/search"
import { getConfig } from "../core/config"

export async function importGtfs(directory: string) {
    if (!directory) printError(`Require directory as arguments!`)

    const logger = new Logger('GTFS-Import')
    const config = getConfig()

    const options: ConnectOptions = {
        namespace: config.surrealdb.namespace,
        database: config.surrealdb.databse,
        auth: {
            access: config.surrealdb.access,
            variables: {
                username: config.surrealdb.username,
		        password: config.surrealdb.password
            }
        }
    }

    logger.printLoading(`Connect to database ${options.namespace} ${options.database}`)

    const surreal = new Surreal()
    await surreal.connect(config.surrealdb.address, options)
    await surreal.ready

    const types: Map<string, Type> = await downloadFromSurreal(surreal, 'type')

    const timetable: Timetable = await surreal.upsert<Timetable, Partial<Timetable>>(new RecordId('timetable', normalize(directory)), { name: directory })

    logger.printLoading(`Importing GTFS data from ${directory}`)
    const gtfsService = new GtfsService(directory)

    logger.printLoading(`Collecting stop information`)
    const stops: Map<string, Stop> = gtfsService.convertStops()

    logger.printLoading(`Upload stops to surrealdb`)

    const stopChunks = splitArray(Array.from(stops.values()), 100)
    for (const [index, stopArray] of stopChunks.entries()) {
        await uploadToSurreal(surreal, new Table('stop'), stopArray)
        logger.printProgress(index * 100, stops.size, 'Uploading gtfs stops')
    }

    logger.printLoading(`Collecting agency information`)
    const operator: Map<string, Operator> = gtfsService.convertAgencies()

    logger.printLoading(`Upload operators to surrealdb`)

    const operatorChunks = splitArray(Array.from(operator.values()), 100)
    for (const [index, operatorArray] of operatorChunks.entries()) {
        await uploadToSurreal(surreal, new Table('operator'), operatorArray)
        logger.printProgress(index * 100, operator.size, 'Uploading gtfs agencies')
    }

    logger.printLoading(`Collecting route information`)
    const routes: Map<string, Route> = gtfsService.convertRoutes(timetable, types, operator)

    logger.printLoading(`Upload routes to surrealdb`)

    const routeChunks = splitArray(Array.from(routes.values()), 500)
    for (const [index, routeArray] of routeChunks.entries()) {
        await surreal.insert(routeArray)
        logger.printProgress(index * 500, routes.size, 'Uploading gtfs routes')
    }

    logger.printLoading(`Collecting trip information`)
    const lines: Map<string, Line> = gtfsService.convertTrips(routes)

    logger.printLoading(`Upload trips to surrealdb`)

    const lineChunks = splitArray(Array.from(lines.values()), 500)
    for (const [index, lineArray] of lineChunks.entries()) {
        await surreal.insert(lineArray)
        logger.printProgress(index * 500, lines.size, 'Uploading gtfs trips')
    }

    logger.printLoading(`Collecting timetable information`)

    const stop_ids: Map<string, GtfsStop> = new Map(gtfsService.stops.map(stop => [ stop.stop_id, stop ]))

    let index = 0
    await gtfsService.streamStopTimes(async connections => {
        for (const connects of connections) {
            const gtfsStop: GtfsStop | undefined = stop_ids.get(connects.stop_id)
            const stop: Stop | undefined = stops.get(connects.stop_id)
            const line: Line | undefined = lines.get(connects.trip_id)
            if (!gtfsStop || !stop) {
                printWarning(`Stop ${connects.stop_id} not found for ${JSON.stringify(connects)}`)
                return
            }
            if (!line) {
                printWarning(`Line ${connects.trip_id} not found for ${JSON.stringify(connects)}`)
                return
            }
            const relation: Connects = {
                id: new RecordId('connects', guid(true)),
                in: line.id,
                out: stop.id,
                arrival: {
                    platform: gtfsStop.platform_code || '',
                    time: new Date(`0000-01-01T${connects.arrival_time.split(':').map(time => time.padStart(2, '0')).slice(0, 2).join(':')}:00Z`)
                },
                departure: {
                    platform: gtfsStop.platform_code || '',
                    time: new Date(`0000-01-01T${connects.departure_time.split(':').map(time => time.padStart(2, '0')).slice(0, 2).join(':')}:00Z`)
                }
            }
            index++
            surreal.insertRelation('connects', relation).catch(error => printWarning(`${error}: ${JSON.stringify(relation)} ${JSON.stringify(connects)}`))
        }
        //await surreal.insertRelation('connects', relations).catch(error => printWarning(`${error}`)) //TODO Grouping
        logger.printProgress(index, 50564128, 'reading', 'stop_times')
        index++
    })

}

async function downloadFromSurreal<T extends Entity>(surreal: Surreal, type: string): Promise<Map<string, T>> {
    return await surreal.select<T>(type)
        .then(results => new Map(results.map(result => [result.id.id.toString(), result])))
        .catch(error => printError(error)) as unknown as Promise<Map<string, T>>
}

async function uploadToSurreal<T>(surreal: Surreal, table: Table, entities: T): Promise<T> {
    return await surreal.query<T[][]>(surql`INSERT INTO ${table} ${entities} ON DUPLICATE KEY UPDATE id = id;`)
        .then(result => result[0])
        .catch(error => printError(error)) as unknown as Promise<T>
}

function splitArray<T>(array: T[], size: number): T[][] {
    return [...Array(Math.ceil(array.length / size))].map((_, i) => array.slice(i * size, (i + 1) * size));
}