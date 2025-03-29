export function enumToArray(enumeration: object): string[] {
    return Object.keys(enumeration).filter(value => isNaN(Number(value)))
}

export function dateToTime(date: Date) {
    if (isNaN(date.getTime())) throw Error(`${date} is not a valid date!`)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}