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

export function dateToLocalDate(date?: Date): string | undefined {
    return date ? date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) : undefined
}

export function dateToISODate(date?: Date): string | undefined {
    return date ? date.toISOString().split('T')[0] : undefined
}

export function isoDateToDate(string?: string): Date | undefined {
    return string && string.match(/\d{4}-\d{2}-\d{2}/g) ? new Date(string) : undefined
}

export function informationToColor(type: 'INFORMATION' | 'WARNING' | 'DISRUPTION' | 'CLEARANCE'): string {
    switch (type) {
        case 'INFORMATION': return 'grey-color'
        case 'WARNING': return 'yellow-color'
        case 'DISRUPTION': return 'red-color'
        case 'CLEARANCE': return 'green-color'
    }
}