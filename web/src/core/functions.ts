export function enumToArray(enumeration: object): string[] {
    return Object.keys(enumeration).filter(value => isNaN(Number(value)))
}

export function dateToTime(date: Date) {
    if (isNaN(date.getTime())) throw Error(`${date} is not a valid date!`)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function timeToDate(time: string) {
    return new Date(`0000-01-01T${time}`)
}

export function guid(timebased?: boolean) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
    let guid = timebased ? Math.floor(Date.now() / 1000).toString(36) : ''
    for (let i = guid.length; i < 20; i++) guid += chars[Math.floor(Math.random() * chars.length)]
    return guid
}