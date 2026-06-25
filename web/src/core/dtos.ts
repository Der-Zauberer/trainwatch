import { RecordId } from "surrealdb"
import type { Address, Color, Location,  Source } from "./types"
import { markRaw } from "vue"

export abstract class Filterable<T> {

    filterBeforeSubmit(): Partial<T> {
        return Object.assign({}, this)
    }
}

export class StopEditDto extends Filterable<StopEditDto> {
    id: RecordId<'stop'> = markRaw(new RecordId('stop', ''))
    name?: string
    score?: number
    platforms: {
        name: string
        length: number
        height: number
        linkedPlatforms: string[]
    }[] = []
    location: Partial<Location> = {}
    address: Partial<Address> = {}
    open: Partial<{
        monday?: string
        tuesday?: string
        wednesday?: string
        thursday?: string
        friday?: string
        saturday?: string
        sunday?: string
    }> = {}
    services: Partial<{
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
    }> = {}
    ids: Partial<{
        uic?: string,
        ril?: string[],
        stada?: string
    }> = {}
    sources: Partial<Source>[] = []

    constructor(initial?: object) {
        super()
        if (initial) Object.assign(this, initial)
    }

    filterBeforeSubmit(): Partial<StopEditDto> {
        const partial: Partial<StopEditDto> = Object.assign({}, this)
        if (isEmpty(this.location)) delete partial.location
        if (isEmpty(this.address)) delete partial.address
        if (isEmpty(this.open)) delete partial.open
        if (isEmpty(this.services)) delete partial.services
        if (isEmpty(this.ids)) delete partial.ids
        if (isEmpty(this.sources)) delete partial.sources
        return partial
    }
}

export class TypeEditDto extends Filterable<TypeEditDto> {
    id: RecordId<'type'> = markRaw(new RecordId('type', ''))
    name?: string
    description?: string
    priority?: number
    color: Color = { background: '', text: '' }
    vehicle: 'TRAIN' | 'BUS' | 'SHIP' | 'PLANE' = 'BUS'
    classification: 'REGIONAL' | 'LONG_DISTANCE' = 'REGIONAL'

    constructor(initial?: object) {
        super()
        if (initial) Object.assign(this, initial)
    }
}

export class OperatorEditDto extends Filterable<OperatorEditDto> {
    id: RecordId<'operator'> = markRaw(new RecordId('operator', ''))
    name?: string
    address: Partial<Address> = {}
    website?: string
    [key: string]: unknown

    constructor(initial?: object) {
        super()
        if (initial) Object.assign(this, initial)
    }

    filterBeforeSubmit(): Partial<OperatorEditDto> {
        const partial: Partial<OperatorEditDto> = Object.assign({}, this)
        if (isEmpty(this.address)) delete partial.address
        return partial
    }
}

export class TimetableEditDto extends Filterable<TimetableEditDto> {
    id: RecordId<'timetable'> = markRaw(new RecordId('timetable', ''))
    name?: string

    constructor(initial?: object) {
        super()
        if (initial) Object.assign(this, initial)
    }
}

export class RouteEditDto extends Filterable<RouteEditDto> {
    id: RecordId<'route'> = markRaw(new RecordId('route', ''))
    name?: string
    timetable?: RecordId<'route'>
    designations: {
        type?: RecordId<'type'>
        number: string
    }[] = []
    operator?: RecordId<'operator'>
    [key: string]: unknown

    constructor(initial?: object) {
        super()
        if (initial) Object.assign(this, initial)
    }
}

export class LineEditDto extends Filterable<RouteEditDto> {
    id: RecordId<'line'> = markRaw(new RecordId('line', ''))
    route?: RecordId<'route'>

    constructor(initial?: object) {
        super()
        if (initial) Object.assign(this, initial)
    }
}

export class JourneyEditDto extends Filterable<JourneyEditDto> {
    id: RecordId<'journey'> = markRaw(new RecordId('journey', ''))
    line?: RecordId<'line'>

    constructor(initial?: object) {
        super()
        if (initial) Object.assign(this, initial)
    }
}

export class InformationEditDto extends Filterable<RouteEditDto> {
    id: RecordId<'information'> = markRaw(new RecordId('information', ''))
    name?: string
    type: 'INFORMATION' | 'WARNING' | 'DISRUPTION' | 'CLEARANCE' = 'INFORMATION'
    description?: string
    content?: string

    constructor(initial?: object) {
        super()
        if (initial) Object.assign(this, initial)
    }
}

export class RoleEditDto extends Filterable<RoleEditDto> {
    id: RecordId<'role'> = markRaw(new RecordId('role', ''))
    name?: string
    permissions: string[] = []

    constructor(initial?: object) {
        super()
        if (initial) Object.assign(this, initial)
    }
}

export class UserEditDto extends Filterable<UserEditDto> {
    id: RecordId<'user'> = markRaw(new RecordId('user', ''))
    name?: string
    email?: string
    password?: string
    roles: RecordId<'role'>[] = []
    permissions: string[] = []
    account: { enabled: boolean, expiry?: Date } = { enabled: true }
    credentials: { change: boolean, expiry?: Date } = { change: true }

    constructor(initial?: object) {
        super()
        if (initial) Object.assign(this, initial)
        delete this.password
    }
}

function isEmpty(object: object): boolean {
    return Object.values(object).every(value => value === '' || value === undefined)
}