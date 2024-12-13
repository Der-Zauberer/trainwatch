import type { RecordId } from "surrealdb";

export interface Search {
    id: RecordId
    name: string
}

export interface Stop {
    id: RecordId
    name: string
    score: number
    platforms: Platform[]
    location: Location
    address: Address
    open: Open
    services: Services
    ids: { [key: string]: string | string[] }
    sources: Source[]
    [key: string]: unknown
}

export interface Platform {
    name: string
    length: number
    height: number
    linkedPlatforms: string[]
}

export interface Location {
    latitude: number
    longitude: number
}

export interface Address {
    street: string | undefined
    zipcode: string | undefined
    city: string | undefined
    federalState: string | undefined
    country: string | undefined
}

export interface Open {
    monday: string | undefined
    tuesday: string | undefined
    wednesday: string | undefined
    thursday: string | undefined
    friday: string | undefined
    saturday: string | undefined
    sunday: string | undefined
}

export interface Services {
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

export interface Source {
    name: string
    license: string
    url: string
    updated: string
}