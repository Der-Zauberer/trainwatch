import type { RecordId } from "surrealdb";

export type HttpError = {
    statusCode: number
    message: string
}

export type Search = {
    id: RecordId
    name: string
}

export type Location = {
    latitude: number
    longitude: number
}

export type Address = {
    street: string | undefined
    zipcode: string | undefined
    city: string | undefined
    federalState: string | undefined
    country: string | undefined
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

export type Stop = {
    id: RecordId
    name: string
    score: number
    platforms: {
        name: string
        length: number
        height: number
        linkedPlatforms: string[]
    }[]
    location: Location
    address: Address
    open: {
        monday: string | undefined
        tuesday: string | undefined
        wednesday: string | undefined
        thursday: string | undefined
        friday: string | undefined
        saturday: string | undefined
        sunday: string | undefined
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
        mobilityService: string | undefined
    }
    ids: { [key: string]: string | string[] }
    sources: Source[]
    [key: string]: unknown
}

export type Type = {
    id: RecordId
    name: string
    description: string
    color: Color
    vehicle: 'TRAIN' | 'BUS' | 'SHIP' | 'PLANE'
    classification: 'REGIONAL' | 'LONG_DISTANCE'
}

export type Operator = {
    id: RecordId
    name: string
    address: Address
    website: string
}

export type Route = {
    id: RecordId
    name?: string
    designations: {
        type: Type
        number: string
    }[],
    operator?: Operator
}

export type Line = {
    id: RecordId
    route: Route
}

export type Journey = {
    id: RecordId
    line: Line
}

export type Role = {
    id: RecordId
    name: string
    permissions: string[]
}

export type User = {
    id: RecordId
    name: string
    email: string
    string?: string
    roles: Role[]
    permissions: string[]
}