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

export type Timetable = Entity<'timetable'>

export type Route = {
    id: RecordId<'route'>
    name?: string
    timetable: RecordId<'timetable'>
    designations: {
        type: RecordId<'type'>
        number: string
    }[],
    operator?: RecordId<'operator'>
}

export type Line = {
    id: RecordId<'line'>
    route: RecordId<'route'>
}

export type Connects = {
    id: RecordId<'connects'>
    in: RecordId<'line'>
    out: RecordId<'stop'>
    arrival: {
        platform: string
        time: Date
    },
    departure: {
        platform: string
        time: Date
    }
}