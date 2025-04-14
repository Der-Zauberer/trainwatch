import Path from 'path'
import { readFile, readFileAsStream } from '../core/files'
import { CSV } from '../core/csv'
import { LineCreation, Operator, Route, RouteCreation, Stop, Timetable, Type } from '../core/types'
import { RecordId } from 'surrealdb'
import { normalize } from '../core/search'
import { printWarning } from '../core/cli'

export type GtfsAgency = {
    agency_id: string
    agency_name: string
    agency_url: string
    agency_timezone: string
    agency_lang: string
    agency_phone: string
}

export type GtfsStop = {
    stop_id: string
    stop_name: string
    stop_desc?: string
    stop_lat: string
    stop_lon: string
    zone_id?: string
    location_type: string
    parent_station: string
    wheelchair_boarding?: string
    level_id?: string
    platform_code?: string
}

export type GtfsStopTime = {
    trip_id: string
    arrival_time: string
    departure_time: string
    stop_id: string
    stop_sequence: string
    stop_headsign?: string
    pickup_type: string
    drop_off_type: string
    shape_dist_traveled?: string
}

export type GtfsRoute = {
    route_id: string
    agency_id: string
    route_short_name: string
    route_long_name: string
    route_desc?: string
    route_type: string
}

export type GtfsTrip = {
    route_id: string
    service_id: string
    trip_id: string
    shape_id?: string
    trip_headsign: string
    trip_short_name: string
    direction_id: string
    block_id: string
    original_trip_id?: string
}

export class GtfsService {

    public readonly agencies: GtfsAgency[]
    public readonly routes: GtfsRoute[]
    public readonly stops: GtfsStop[]
    public readonly trips: GtfsTrip[]

    constructor(private directory: string) {
        this.agencies = CSV.parse(readFile(Path.join(directory, 'agency.txt')))
        this.routes = CSV.parse(readFile(Path.join(directory, 'routes.txt')))
        this.stops = CSV.parse(readFile(Path.join(directory, 'stops.txt')))
        this.trips = CSV.parse(readFile(Path.join(directory, 'trips.txt')))
    }

    async streamStopTimes(connection: (connects: GtfsStopTime) => void) {
        let header: string[]
        let chunk = 100
        await readFileAsStream(Path.join(this.directory, 'stop_times.txt'), async (lines) => {
            if (!header) header = CSV.parseHeader(lines.shift() || '')
            for (const connects of CSV.parseChunk(header, lines) as GtfsStopTime[]) {
                connection(connects)
            }
        }, chunk)
    }

    convertAgencies(): Map<string, Operator> {
        const agencies: Map<string, Operator> = new Map()
        for (const agency of this.agencies) {
            agencies.set(agency.agency_id, {
                id: new RecordId('operator', normalize(agency.agency_name, '_')),
                name: agency.agency_name,
                address: agency.agency_phone ? { phone: agency.agency_phone }: {},
                website: agency.agency_url,
            })
        }
        return agencies
    }

    convertRoutes(timetable: Timetable, types: Map<string, Type>, operators: Map<string, Operator>): Map<string, RouteCreation> {
        const unknown: Set<string> = new Set()
        const routes: Map<string, RouteCreation> = new Map()
        for (const route of this.routes) {
            const designation = this.splitDesignation(route.route_short_name)
            const type = types.get((designation.type || route.route_desc || 'B').toLowerCase())

            if (!type && designation.type) {
                unknown.add(designation.type)
            }

            routes.set(route.route_id, {
                name: route.route_long_name,
                timetable: timetable.id,
                designations: [
                    type ? { type: type.id, number: designation.number } : { type: new RecordId('type', 'b'), number: route.route_short_name }
                ],
                operator: operators.get(route.agency_id)?.id
            })
        }
        printWarning(`Can't find the following types: ${Array.from(unknown)}`)
        return routes
    }

    convertStops(): Map<string, Stop> {
        const stops: Map<string, Stop> = new Map()
        for (const stop of this.stops) {
            const gtfsIdArray: string[] = stop.stop_id.split(':')
            const uic: string | undefined = gtfsIdArray[2] !== undefined && gtfsIdArray[2].length === 7 ? gtfsIdArray[2] : undefined
            const platform: string |undefined = gtfsIdArray[4] || stop.platform_code || undefined
            const existingStop: Stop | undefined = stops.get(stop.stop_id)

            if (existingStop && platform) {
                existingStop?.platforms?.push({ name: platform, height: 0, length: 0, linkedPlatforms: [] })
                existingStop?.platforms?.sort((a, b) => a.name.localeCompare(b.name))
                stops.set(stop.stop_id, existingStop)
            } else {
                stops.set(stop.stop_id, {
                    id: new RecordId('stop', normalize(stop.stop_name, '_')),
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
        return stops
    }

    convertTrips(routes: Map<string, Route>): Map<string, LineCreation> {
        const lines: Map<string, LineCreation> = new Map()
        for (const trip of this.trips) {
            const route = routes.get(trip.route_id)

            if (!route) {
                printWarning(`Route ${trip.route_id} not found`)
                continue
            }

            lines.set(trip.trip_id, {
                route: route.id
            })
        }

        return lines;
    }

    private splitDesignation(string: string): { type?: string, number: string } {
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

}