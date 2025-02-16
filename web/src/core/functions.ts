export function enumToArray(enumeration: object): string[] {
    return Object.keys(enumeration).filter(value => isNaN(Number(value)))
}

export function dateToTime(date: Date) {
    if (isNaN(date.getTime())) return '00:00'
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}