import Surreal, { ConnectOptions, surql, Table } from "surrealdb"
import { Logger, printError } from "../core/cli"
import { getConfig } from "../core/config"
import { readFile } from "../core/files"
import { Stop } from "../core/types"

export async function importStops(file: string) {
    const logger = new Logger('DB/Stada')
    const config = getConfig()
    if (!file) printError(`Require the file as arguments!`)
    
    logger.printLoading(`Read file ${file}`)
    const stops: Stop[] = JSON.parse(readFile(file) || '[]')

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

    const stopChunks = splitArray(Array.from(stops.values()), 10)
    for (const [index, stopArray] of stopChunks.entries()) {
        await uploadToSurreal(surreal, new Table('stop'), stopArray)
        logger.printProgress(index * 10, stops.length, 'Uploading stops')
    }
    logger.print(`Uplooaded ${stops.length} stops`, true)
}

async function uploadToSurreal<T>(surreal: Surreal, table: Table, entities: T): Promise<T> {
    return await surreal.query<T[][]>(surql`INSERT INTO ${table} ${entities} ON DUPLICATE KEY UPDATE id = id;`)
        .then(result => result[0])
        .catch(error => printError(error)) as unknown as Promise<T>
}

function splitArray<T>(array: T[], size: number): T[][] {
    return [...Array(Math.ceil(array.length / size))].map((_, i) => array.slice(i * size, (i + 1) * size));
}