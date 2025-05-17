import type { RecordId } from "surrealdb";

export enum Vehicle {
    TRAIN,
    BUS,
    SHIP,
    PLANE,
}

export enum Classification {
    REGIONAL,
    LONG_DISTANCE,
}

export type HttpError = {
    statusCode: number
    message: string
}

export type Parameter = {
    search: string
    page: number
    size: number
    count: number
}

export type Entity<T extends string = string> = {
    id: RecordId<T>
    name: string
}

export type Location = {
    latitude: number
    longitude: number
}

export type Address = {
    street?: string
    zipcode?: string
    city?: string
    federalState?: string
    country?: string
    email?: string
    phone?: string
}

export type Source = {
    name: string
    license: string
    url: string
    updated: string
}

export type Color = {
    text: string
    background: string
}

export type Stop = Entity<'stop'> & {
    score: number
    platforms: {
        name: string
        length: number
        height: number
        linkedPlatforms: string[]
    }[]
    location?: Location
    address?: Address
    open?: {
        monday?: string
        tuesday?: string
        wednesday?: string
        thursday?: string
        friday?: string
        saturday?: string
        sunday?: string
    }
    services: {
        parking: boolean
        localPublicTransport: boolean
        carRental: boolean
        taxi: boolean
        publicFacilities: boolean
        travelNecessities: boolean
        locker: boolean
        wifi: boolean
        information: boolean
        railwayMission: boolean
        lostAndFound: boolean
        barrierFree: boolean
        mobilityService: string
    }
    ids?: {
        uic?: string,
        ril?: string[],
        stada?: string
    }
    sources: Source[]
}

export type Type = Entity<'type'> & {
    description: string
    priority: number
    color: Color
    vehicle: 'TRAIN' | 'BUS' | 'SHIP' | 'PLANE'
    classification: 'REGIONAL' | 'LONG_DISTANCE'
}

export type Operator = Entity<'operator'> & {
    address?: Address
    website?: string
}

export type Timetable = Entity<'timetable'> & {

}

export type Route = {
    id: RecordId<'route'>
    name?: string
    timetable: Timetable
    designations: {
        type: Type
        number: string
    }[],
    operator?: Operator
}

export type Line = {
    id: RecordId<'line'>
    route: Route
}

export type LineStops = Line & {
    stops: {
        id: RecordId<'stop'>
        name: string,
        arrival: { 
            platform: string,
            time: Date
        },
        departure: {
            platform: string,
            time: Date
        }
    }[]
}

export type Journey = {
    id: RecordId<'journey'>
    line: Line
}

export type Role = Entity<'role'> & {
    permissions: string[]
}

export type User = Entity<'user'> & {
    email: string
    password?: string
    roles: Role[]
    permissions: string[]
}

export type BoardLine = {
    id: RecordId<'connects'>
    arrival: { 
        platform: string,
        time: Date
    },
    departure: {
        platform: string,
        time: Date
    },
    stops: Entity<'stop'>[]
    line: Line
}