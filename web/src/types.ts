import type { RecordId } from "surrealdb";

export type Search = {
    id: RecordId
    name: string
}

export type Stop = {
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

export type Platform = {
    name: string
    length: number
    height: number
    linkedPlatforms: string[]
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

export type Open = {
    monday: string | undefined
    tuesday: string | undefined
    wednesday: string | undefined
    thursday: string | undefined
    friday: string | undefined
    saturday: string | undefined
    sunday: string | undefined
}

export type Services = {
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

export type Source = {
    name: string
    license: string
    url: string
    updated: string
}