import FileSystem from 'node:fs'

export type Config = {
    dbMarketplace: {
        clientId: string
        apiKey: string
    }
    surrealdb: {
        address: string
        namespace: string
        databse: string
        access: string
        username: string
        password: string
    }
}

const EMPTY_CONFIG: Config = {
    dbMarketplace: {
        clientId: '',
        apiKey: '',
    },
    surrealdb: {
        address: '',
        namespace: '',
        databse: '',
        access: '',
        username: '',
        password: ''
    }
}

const CHARSET = 'utf8'
const CONFIG_FILE = 'data/config.json'

if (!FileSystem.existsSync(CONFIG_FILE)) {
    FileSystem.writeFileSync(CONFIG_FILE, JSON.stringify(EMPTY_CONFIG, null, '\t'), CHARSET)
}

export function getConfig(): Config {
    if (!FileSystem.existsSync(CONFIG_FILE)) throw new Error(`The config doesn't exist!`)
    return JSON.parse(FileSystem.readFileSync(CONFIG_FILE, CHARSET))
}