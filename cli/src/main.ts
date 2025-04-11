
import { downloadApiDBRisStationsPlatform, downloadApiDBStada } from "./commands/download.command"
import { Commands, executeCommand, test, Test } from "./core/cli"
import { beginnScoreMatching, extractIds, normalize, nWordEdgeNgram } from "./core/search"
import { CSV } from "./core/csv"
import { importGtfs } from "./commands/gtfs.command"

const coreTests: Test[] = [
    {
        name: 'SEARCH.normalize() should return without seperator',
        execute: () => normalize(' Fäßchen/Brücken-Straße (Brötchen)Compañía '),
        expect: 'faesschenbrueckenstrassebroetchencompania'
    },
    {
        name: 'SEARCH.normalize() should return with blank seperator',
        execute: () => normalize(' Fäßchen/Brücken-Straße (Brötchen)Compañía ', ' '),
        expect: 'faesschen bruecken strasse broetchen compania'
    },
    {
        name: 'SEARCH.normalize() should return with underscore seperator',
        execute: () => normalize(' Fäßchen/Brücken-Straße (Brötchen)Compañía ', '_'),
        expect: 'faesschen_bruecken_strasse_broetchen_compania'
    },
    {
        name: 'SEARCH.extractIds() should extract ids',
        execute: () => extractIds({ eva: 8011160, stada: 1071, ril: [ 'BHBF', 'BL', 'BLS' ] }),
        expect: [ '8011160', '1071', 'bhbf', 'bl', 'bls' ]
    },
    {
        name: 'SEARCH.beginnScoreMatching() should match first entry',
        execute: () => beginnScoreMatching('Karlsruhe', { search: 'Karlsruhe Hbf', score: 0 }, { search: 'Leipzig Karlsruher Straße', score: 0 }),
        expect: -1
    },
    {
        name: 'SEARCH.beginnScoreMatching() should match second entry',
        execute: () => beginnScoreMatching('Karlsruhe', { search: 'Leipzig Karlsruher Straße', score: 0 }, { search: 'Karlsruhe Hbf', score: 0 }),
        expect: 1
    },
    {
        name: 'SEARCH.beginnScoreMatching() should score second entry',
        execute: () => beginnScoreMatching('Karlsruhe', { search: 'Leipzig Karlsruher Straße', score: 0 }, { search: 'Karlsruhe Hbf', score: 1 }),
        expect: 1
    },
    {
        name: 'SEARCH.beginnScoreMatching() should score second entry',
        execute: () => beginnScoreMatching('Karlsruhe', { search: 'Leipzig Karlsruher Straße', score: 1 }, { search: 'Karlsruhe Hbf', score: 0 }),
        expect: 1
    },
    {
        name: 'SEARCH.beginnScoreMatching() should rank first entry',
        execute: () => beginnScoreMatching('Karlsruhe', { search: 'Karlsruhe Hbf', score: 10 }, { search: 'Leipzig Karlsruher Straße', score: 1 }),
        expect: 9
    },
    {
        name: 'SEARCH.nWordEgeNgram() should return N-Word-Edge-Ngram',
        execute: () => nWordEdgeNgram('What why'),
        expect: ['W', 'Wh', 'Wha', 'What', 'Whatw', 'Whatwh', 'Whatwhy', 'w', 'wh', 'why']
    },
    {
        name: 'CSV.parse() should parse CSV',
        execute: () => {
            const csv = 'id;name;platforms\nsingen_hohentwiel;Singen (Hohentwiel);8\nradolfzell;Radolfzell;\n'
            return CSV.parse(csv, ';')
        },
        expect: [ { id: 'singen_hohentwiel', name: 'Singen (Hohentwiel)', platforms: 8 }, { id: 'radolfzell', name: 'Radolfzell' } ]
    },
    {
        name: 'CSV.stringify() should stringify CSV',
        execute: () => {
            const csv = [ { id: 'singen_hohentwiel', name: 'Singen (Hohentwiel)', platforms: 8 }, { id: 'radolfzell', name: 'Radolfzell' } ]
            return CSV.stringify(csv, undefined, ';')
        },
        expect: 'id;name;platforms\nsingen_hohentwiel;Singen (Hohentwiel);8\nradolfzell;Radolfzell;\n'
    },
    {
        name: 'CSV.stringify() should stringify CSV with replacer array',
        execute: () => {
            const csv = [ { id: 'singen_hohentwiel', name: 'Singen (Hohentwiel)', platforms: 8 }, { id: 'radolfzell', name: 'Radolfzell' } ]
            return CSV.stringify(csv, ['id', 'name'], ';')
        },
        expect: 'id;name\nsingen_hohentwiel;Singen (Hohentwiel)\nradolfzell;Radolfzell\n'
    },
    {
        name: 'CSV.stringify() should stringify CSV with replacer function',
        execute: () => {
            const csv = [ { id: 'singen_hohentwiel', name: 'Singen (Hohentwiel)', platforms: 8 }, { id: 'radolfzell', name: 'Radolfzell' } ]
            return CSV.stringify(csv, (key, value) => key === 'id' ? `id:${value}` : value, ';')
        },
        expect: 'id;name;platforms\nid:singen_hohentwiel;Singen (Hohentwiel);8\nid:radolfzell;Radolfzell;\n'
    },
    {
        name: 'CSV.stringify() should stringify CSV with filter replacer function',
        execute: () => {
            const csv = [ { id: 'singen_hohentwiel', name: 'Singen (Hohentwiel)', platforms: 8 }, { id: 'radolfzell', name: 'Radolfzell' } ]
            return CSV.stringify(csv, (key, value) => key === 'id' ? undefined : value, ';')
        },
        expect: 'name;platforms\nSingen (Hohentwiel);8\nRadolfzell;\n'
    }
]

const commands: Commands = {
    download: {
        'DB/Stada': { 
            execute: downloadApiDBStada,
            usage: 'download DB/Stada <client-id> <api-key> [file]',
            description: 'Downloads stops from the DB Stada API to a file'
        },
        'DB/RIS/Stations': { 
            execute: downloadApiDBRisStationsPlatform,
            usage: 'download DB/RIS/Stations <client-id> <api-key> [file]',
            description: 'Downloads platforms for already downloaded stops from the DB Ris::Stations API to a file'
        }
    },
    gtfs: {
        import: {
            execute: importGtfs,
            usage: 'gtfs import <file>',
            description: 'Imports GTFS data from a CSV files'
        }
    },
    test: {
        core: {
            execute: () => test(coreTests),
            usage: 'test core',
            description: 'Tests core functions'
        }
    }
}

executeCommand(commands)