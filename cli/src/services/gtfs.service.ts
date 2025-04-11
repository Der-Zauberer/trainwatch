import Path from 'path'
import { readFile } from '../core/files'
import { CSV } from '../core/csv'

export type GtfsAgency = {
    agency_id: string
    agency_name: string
    agency_url: string
    agency_timezone: string
    agency_lang: string
    agency_phone: string
}

export type GtfsStops = {
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

export type GtfsStopTimes = {
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

export type GtfsRoutes = {
    route_id: string
    agency_id: string
    route_short_name: string
    route_long_name: string
    route_desc?: string
    route_type: string
}

export type GtfsTrips = {
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
    public readonly routes: GtfsRoutes[]
    public readonly stops: GtfsStops[]
    public readonly trips: GtfsTrips[]

    constructor(directory: string) {
        this.agencies = CSV.parse(readFile(Path.join(directory, 'agency.txt'))) as GtfsAgency[]
        this.routes = CSV.parse(readFile(Path.join(directory, 'routes.txt'))) as GtfsRoutes[]
        this.stops = CSV.parse(readFile(Path.join(directory, 'stops.txt'))) as GtfsStops[]
        this.trips = CSV.parse(readFile(Path.join(directory, 'trips.txt'))) as GtfsTrips[]
    }

}