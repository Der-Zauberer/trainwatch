export function time(value: string): string {
    const date = new Date(value)
    if (isNaN(date.getTime())) return '00:00'
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}