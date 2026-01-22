import type { BoardLine, Type } from "@/core/types";
import { RecordId } from "surrealdb";
import type { App } from "vue"
import surrealdbService, { normalize, SurrealDbService } from "./surrealdb.service";

export class DbTimetableService {

    constructor(private surrealDbService: SurrealDbService) {}

    async getTimetableBoard(uic: string, date: Date = new Date()): Promise<BoardLine[]> {
        const dateString = date.toISOString().split('T')[0].replace(/-/g, '').substring(2)
        const hour = ('0' + date.getHours()).slice(-2)
        const url = `https://iris.noncd.db.de/iris-tts/timetable/plan/${uic}/${dateString}/${hour}`
        return fetch(url)
            .then(response => response.ok ? response.text() : Promise.reject())
            .then(response => new DOMParser().parseFromString(response, 'text/xml'))
            .then(async response => {
                const board: BoardLine[] = []
                const station = { id: uic, name: response.querySelector('timetable')!.getAttribute('station')!.replace(/(?!\s)\(/g, ' (') }
                const types = new Map(await this.surrealDbService.select<Type>('type').then(result => result.map(type => [type.id.id, type])))
                for (const element of response.querySelector('timetable')!.children) {
                    const general = element.querySelector('tl')!
                    const arrival = element.querySelector('ar')
                    const departure = element.querySelector('dp')
                    const stops = [
                        ...(arrival ? arrival.getAttribute('ppth')!.split('|').map(element => ({ name: element.replace(/(?!\s)\(/g, ' (') })) : []),
                        station,
                        ...(departure ? departure.getAttribute('ppth')!.split('|').map(element => ({ name: element.replace(/(?!\s)\(/g, ' (') })) : [])
                    ].map(station => ({ id: new RecordId('stop', normalize(station.name, '_')), name: station.name }))
                    const line = (departure ? departure : arrival)!.getAttribute('l')
                    const type = general.getAttribute('c')
                    const classification = type !== 'SBB' ? type : (line || type).replace(/\d/g, '')

                    board.push({
                        id: new RecordId('connects', 'unknwn'),
                        line: {
                            id: new RecordId('line', 'unknown'),
                            route: {
                                id: new RecordId('route', 'unknown'),
                                name: 'unknown',
                                operator: {
                                    id: new RecordId('operator', 'unknown'),
                                    name: 'unknown'
                                },
                                timetable: {
                                    id: new RecordId('timetable', 'unknown'),
                                    name: 'DB Timetale API'
                                },
                                designations: [
                                    {
                                        number: (line || '').replace(/\D/g, ''),
                                        type: types.get(classification?.toLowerCase()!) || {
                                            id: new RecordId('type', 'unknown'),
                                            name: classification || '',
                                            description: '',
                                            classification: 'LONG_DISTANCE',
                                            vehicle: 'TRAIN',
                                            color: {
                                                text: '#ffffff',
                                                background: '#000000'
                                            },
                                            priority: 0,
                                        }
                                    }
                                ]
                            }
                        },
                        stops,
                        arrival: {
                            time: this.parseTime(arrival?.getAttribute('pt') || departure?.getAttribute('pt') || '0001010000'),
                            platform: arrival?.getAttribute('pp') || departure?.getAttribute('pp') || ''
                        },
                        departure: {
                            time: this.parseTime(departure?.getAttribute('pt') || arrival?.getAttribute('pt') || '0001010000'),
                            platform: departure?.getAttribute('pp')! || arrival?.getAttribute('pp') || ''
                        }
                    })
                }
                return board.sort((entry1, entry2) => {
                    const time1 = (entry1.departure ? entry1.departure : entry1.arrival).time.getTime()
                    const time2 = (entry2.departure ? entry2.departure : entry2.arrival).time.getTime()
                    return time1 - time2
                })
            })
    }

    private parseTime(time: string): Date {
        const timesplit = time.match(/.{1,2}/gm)!.map(value => Number(value)) as [number, number, number, number, number]
        return new Date(timesplit[0], timesplit[1], timesplit[2], timesplit[3], timesplit[4])
    }

}

export const DB_TIMETABLE_SERVICE = 'dbTimetableService';

export default {
    install(app: App) {
        const surrealDbService = app.config.globalProperties.$surrealDbService
        const dbTimetableService = new DbTimetableService(surrealDbService)
        app.config.globalProperties.$dbTimetableService = dbTimetableService
        app.provide(DB_TIMETABLE_SERVICE, dbTimetableService)
    }
}