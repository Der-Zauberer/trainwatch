---------------
-- Functions --
---------------

DEFINE FUNCTION OVERWRITE fn::name::normalize($name: string, $seperator: option<string>) {
    RETURN function($name, $seperator) {
        const [name, seperator] = arguments;
        let formatted = '';
        let blank = false;
        const replacements = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
        for (let char of name.toLowerCase()) {
            if (replacements[char]) {
                formatted += replacements[char];
                blank = false;
            } else if (char === ' ' || char === '/' || char === '-' || char === '(' || char === ')') {
                if (!blank) {
                    if (seperator) formatted += seperator;
                    blank = true;
                }
            } else if ((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
                formatted += char;
                blank = false;
            } else if (char.charCodeAt(0) > 127) {
                const normalized = char.normalize('NFD');
                if (char !== normalized) formatted += normalized[0];
            }
        }
        return formatted;
    } 
};

DEFINE FUNCTION OVERWRITE fn::search::n_word_edge_ngram($name: string) {
    RETURN function($name) {
        const [name] = arguments;
        const parts = [];
        let currentName = ''
        for (let i = name.length -1; i >= 0; i--) {
            if (name[i] !== ' ') currentName = name[i] + currentName;
            else parts.unshift(currentName);
        }
        parts.unshift(currentName);
        const result = []
        for (const part of parts) {
            for (let i = 1; i <= part.length; i++) {
                result.push(part.slice(0, i));
            }
        }
        return result;
    }
};

DEFINE FUNCTION OVERWRITE fn::search::sort_beginn_score_matching($search: string, $entities:array<any>) {
    RETURN function($search, $entities) {
        const [search, entities] = arguments;
        const beginnScoreMatching = (search, a, b) => {
            if (a.score !== b.score) return a.score - b.score;
            const aStartsWithName = a.search.startsWith(search);
            const bStartsWithName = b.search.startsWith(search);
            if (aStartsWithName && !bStartsWithName) return -1;
            else if (!aStartsWithName && bStartsWithName) return 1;
            else return 0;
        }
        return entities.sort((a, b) => beginnScoreMatching(search, a, b));
    }
};

----------
-- Stop --
----------

DEFINE TABLE IF NOT EXISTS Stop SCHEMAFULL
	PERMISSIONS
		FOR select FULL;
DEFINE FIELD OVERWRITE id ON TABLE Stop;
DEFINE FIELD OVERWRITE name ON TABLE Stop TYPE string;
DEFINE FIELD OVERWRITE score ON TABLE Stop TYPE int;
DEFINE FIELD OVERWRITE platforms ON TABLE Stop TYPE array<object>;
DEFINE FIELD OVERWRITE platforms.*.name ON TABLE Stop TYPE string;
DEFINE FIELD OVERWRITE platforms.*.name ON TABLE Stop TYPE string;
DEFINE FIELD OVERWRITE platforms.*.length ON TABLE Stop TYPE int;
DEFINE FIELD OVERWRITE platforms.*.linkedPlatforms ON TABLE Stop TYPE array<int>;
DEFINE FIELD OVERWRITE location ON TABLE Stop TYPE object;
DEFINE FIELD OVERWRITE location.latitude ON TABLE Stop TYPE option<float>;
DEFINE FIELD OVERWRITE location.longitude ON TABLE Stop TYPE option<float>;
DEFINE FIELD OVERWRITE address ON TABLE Stop TYPE object;
DEFINE FIELD OVERWRITE address.street ON TABLE Stop TYPE option<string>;
DEFINE FIELD OVERWRITE address.zipcode ON TABLE Stop TYPE option<string>;
DEFINE FIELD OVERWRITE address.city ON TABLE Stop TYPE option<string>;
DEFINE FIELD OVERWRITE address.federalState ON TABLE Stop TYPE option<string>;
DEFINE FIELD OVERWRITE address.country ON TABLE Stop TYPE option<string>;
DEFINE FIELD OVERWRITE open.monday ON TABLE Stop TYPE option<string>;
DEFINE FIELD OVERWRITE open.tuesday ON TABLE Stop TYPE option<string>;
DEFINE FIELD OVERWRITE open.wednesday ON TABLE Stop TYPE option<string>;
DEFINE FIELD OVERWRITE open.thursday ON TABLE Stop TYPE option<string>;
DEFINE FIELD OVERWRITE open.friday ON TABLE Stop TYPE option<string>;
DEFINE FIELD OVERWRITE open.saturday ON TABLE Stop TYPE option<string>;
DEFINE FIELD OVERWRITE open.sunday ON TABLE Stop TYPE option<string>;
DEFINE FIELD OVERWRITE services ON TABLE Stop TYPE object;
DEFINE FIELD OVERWRITE services.parking ON TABLE Stop TYPE bool VALUE false;
DEFINE FIELD OVERWRITE services.localPublicTransport ON TABLE Stop TYPE bool VALUE false;
DEFINE FIELD OVERWRITE services.carRental ON TABLE Stop TYPE bool VALUE false;
DEFINE FIELD OVERWRITE services.taxi ON TABLE Stop TYPE bool VALUE false;
DEFINE FIELD OVERWRITE services.publicFacilities ON TABLE Stop TYPE bool VALUE false;
DEFINE FIELD OVERWRITE services.travelNecessities ON TABLE Stop TYPE bool VALUE false;
DEFINE FIELD OVERWRITE services.locker ON TABLE Stop TYPE bool VALUE false;
DEFINE FIELD OVERWRITE services.wifi ON TABLE Stop TYPE bool VALUE false;
DEFINE FIELD OVERWRITE services.information ON TABLE Stop TYPE bool VALUE false;
DEFINE FIELD OVERWRITE services.railwayMission ON TABLE Stop TYPE bool VALUE false;
DEFINE FIELD OVERWRITE services.lostAndFound ON TABLE Stop TYPE bool VALUE false;
DEFINE FIELD OVERWRITE services.barrierFree ON TABLE Stop TYPE bool VALUE false;
DEFINE FIELD OVERWRITE services.mobilityService ON TABLE Stop TYPE option<string>;
DEFINE FIELD OVERWRITE ids ON TABLE Stop TYPE object;
DEFINE FIELD OVERWRITE ids.eva ON TABLE Stop TYPE option<int>;
DEFINE FIELD OVERWRITE ids.ril ON TABLE Stop TYPE option<array<string>>;
DEFINE FIELD OVERWRITE ids.stada ON TABLE Stop TYPE option<int>;
DEFINE FIELD OVERWRITE sources ON TABLE Stop TYPE array<object>;
DEFINE FIELD OVERWRITE sources.*.name ON TABLE Stop TYPE string;
DEFINE FIELD OVERWRITE sources.*.url ON TABLE Stop TYPE string ASSERT string::is::url($value);
DEFINE FIELD OVERWRITE sources.*.used ON TABLE Stop TYPE string;

DEFINE TABLE IF NOT EXISTS StopSearch SCHEMAFULL
	PERMISSIONS
		FOR select FULL;
DEFINE FIELD OVERWRITE entries ON TABLE StopSearch TYPE array<object>;
DEFINE FIELD OVERWRITE entries.*.id ON TABLE StopSearch TYPE record<Stop>;
DEFINE FIELD OVERWRITE entries.*.search ON TABLE StopSearch TYPE string;
DEFINE FIELD OVERWRITE entries.*.score ON TABLE StopSearch TYPE number;

DEFINE EVENT OVERWRITE stop_update ON TABLE Stop WHEN $before.name != $after.name || $before.ids != $after.ids THEN {
    IF $before THEN {
        FOR $entry IN fn::search::n_word_edge_ngram(fn::name::normalize($before.name, ' ')) {
            UPDATE type::thing('StopSearch', $entry) SET entries = entries.filter(|$v| $v.id = $before.id);
            DELETE type::thing('StopSearch', $entry) WHERE array::is_empty(entries);
        };
    } END;
    IF $after THEN {
        LET $search = fn::name::normalize($after.name);
        FOR $entry IN fn::search::n_word_edge_ngram(fn::name::normalize($after.name, ' ')) {
            UPSERT ONLY type::thing('StopSearch', $entry) SET id = $entry, entries += { id: $after.id, search: $search, score: $after.score };
            UPDATE ONLY type::thing('StopSearch', $entry) SET entries = fn::search::sort_beginn_score_matching($search, entries);
        };
    } END;
};

DEFINE FUNCTION OVERWRITE fn::stop::index() {
    DELETE StopSearch;
    FOR $stop IN (SELECT * FROM Stop) {
        LET $search = fn::name::normalize($stop.name);
        FOR $entry IN fn::search::n_word_edge_ngram(fn::name::normalize($stop.name, ' ')) {
            UPSERT ONLY type::thing('StopSearch', $entry) SET id = $entry, entries += { id: $stop.id, search: $search, score: $stop.score };
        };
    };
    UPDATE StopSearch SET entries = fn::search::sort_beginn_score_matching(record::id(id), entries);
};

------------------------
-- TransportationType --
------------------------

DEFINE TABLE IF NOT EXISTS TransportationType SCHEMAFULL
	PERMISSIONS
		FOR select FULL;
DEFINE FIELD OVERWRITE id ON TABLE TransportationType;
DEFINE FIELD OVERWRITE name ON TABLE TransportationType TYPE string;
DEFINE FIELD OVERWRITE description ON TABLE TransportationType TYPE string;
DEFINE FIELD OVERWRITE priority ON TABLE TransportationType TYPE int;
DEFINE FIELD OVERWRITE color ON TABLE TransportationType TYPE object;
DEFINE FIELD OVERWRITE color.textColor ON TABLE TransportationType TYPE string;
DEFINE FIELD OVERWRITE color.backgroundColor ON TABLE TransportationType TYPE string;
DEFINE FIELD OVERWRITE vehicle ON TABLE TransportationType TYPE 'TRAIN' | 'BUS' | 'SHIP' | 'PLANE';
DEFINE FIELD OVERWRITE classification ON TABLE TransportationType TYPE 'REGIONAL' | 'LONG_DISTANCE';

INSERT INTO TransportationType [
    {
        "id": "ast",
        "name": "AST",
        "description": "Anruf-Sammel-Taxi",
        "priority": 29,
        "vehicle": "BUS",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#808000"
        }
    },
    {
        "id": "b",
        "name": "BUS",
        "description": "Bus",
        "priority": 26,
        "vehicle": "BUS",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#7f7f7f"
        }
    },
    {
        "id": "cb",
        "name": "BUS",
        "description": "City Bus",
        "priority": 27,
        "vehicle": "BUS",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#808000"
        }
    },
    {
        "id": "cjx",
        "name": "CJX",
        "description": "Cityjet Xpress",
        "priority": 16,
        "vehicle": "TRAIN",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#ff0000"
        }
    },
    { 
        "id": "ec",
        "name": "EC",
        "description": "Eurocity",
        "priority": 1,
        "vehicle": "TRAIN",
        "classification": "LONG_DISTANCE",
        "color": {
            "textColor": "#ffff00",
            "backgroundColor": "#0000ff"
        }
    },
    {
        "id": "ece",
        "name": "ECE",
        "description": "Eurocity Express",
        "priority": 0,
        "vehicle": "TRAIN",
        "classification": "LONG_DISTANCE",
        "color": {
            "textColor": "#ffff00",
            "backgroundColor": "#0000ff"
        }
    },
    {
        "id": "en",
        "name": "EN",
        "description": "EuroNight",
        "priority": 10,
        "vehicle": "TRAIN",
        "classification": "LONG_DISTANCE",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#0000ff"
        }
    },
    { 
        "id": "fex",
        "name": "FEX",
        "description": "Airport Express",
        "vehicle": "TRAIN",
        "priority": 21,
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#ff0000"
        }
    },
    {
        "id": "d",
        "name": "D",
        "description": "Express",
        "priority": 8,
        "vehicle": "TRAIN",
        "classification": "LONG_DISTANCE",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#7f7f7f"
        }
    },
    {
        "id": "dn",
        "name": "DN",
        "description": "Night Express",
        "priority": 8,
        "vehicle": "TRAIN",
        "classification": "LONG_DISTANCE",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#0000ff"
        }
    },
    {
        "id": "ic",
        "name": "IC",
        "description": "Intercity",
        "priority": 7,
        "vehicle": "TRAIN",
        "classification": "LONG_DISTANCE",
        "color": {
            "textColor": "#ff0000",
            "backgroundColor": "#ffffff"
        }
    },
    {
        "id": "ice",
        "name": "ICE",
        "description": "Intercity Express",
        "priority": 6,
        "vehicle": "TRAIN",
        "classification": "LONG_DISTANCE",
        "color": {
            "textColor": "#ff0000",
            "backgroundColor": "#ffffff"
        }
    },
    {
        "id": "ices",
        "name": "ICEs",
        "description": "Intercity Express Sprinter",
        "priority": 5,
        "vehicle": "TRAIN",
        "classification": "LONG_DISTANCE",
        "color": {
            "textColor": "#ff0000",
            "backgroundColor": "#ffffff"
        }
    },
    {
        "id": "ir",
        "name": "IR",
        "description": "Interregio",
        "priority": 15,
        "vehicle": "TRAIN",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#0080ff"
        }
    },
    {
        "id": "ire",
        "name": "IRE",
        "description": "Interregio Express",
        "priority": 16,
        "vehicle": "TRAIN",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#ff0000"
        }
    },
    {
        "id": "nj",
        "name": "NJ",
        "description": "Nightjet",
        "priority": 11,
        "vehicle": "TRAIN",
        "classification": "LONG_DISTANCE",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#0000ff"
        }
    },
    {
        "id": "nl",
        "name": "NL",
        "description": "Nightliner",
        "priority": 25,
        "vehicle": "TRAIN",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#0000ff"
        }
    },
    {
        "id": "mex",
        "name": "MEX",
        "description": "Metropolitan Express",
        "priority": 20,
        "vehicle": "TRAIN",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#ff0000"
        }
    },
    {
        "id": "rgj",
        "name": "RJG",
        "description": "RegioJet",
        "priority": 7,
        "vehicle": "TRAIN",
        "classification": "LONG_DISTANCE",
        "color": {
            "textColor": "#ffff00",
            "backgroundColor": "#ff0000"
        }
    },
    {
        "id": "rj",
        "name": "RJ",
        "description": "Railjet",
        "priority": 6,
        "vehicle": "TRAIN",
        "classification": "LONG_DISTANCE",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#cd3030"
        }
    },
    {
        "id": "rjx",
        "name": "RJX",
        "description": "Railjet Xpress",
        "priority": 5,
        "vehicle": "TRAIN",
        "classification": "LONG_DISTANCE",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#cd3030"
        }
    },
    {
        "id": "re",
        "name": "RE",
        "description": "Regionalexpress",
        "priority": 17,
        "vehicle": "TRAIN",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#ff0000"
        }
    },
    {
        "id": "rex",
        "name": "RE",
        "description": "RegionalExpress",
        "priority": 17,
        "vehicle": "TRAIN",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#ff0000"
        }
    },
    {
        "id": "rb",
        "name": "RB",
        "description": "Regionalbahn",
        "priority": 22,
        "vehicle": "TRAIN",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#ff0000"
        }
    },
    {
        "id": "ruf",
        "name": "RUF",
        "description": "Rufbus",
        "priority": 28,
        "vehicle": "BUS",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#808000"
        }
    },
    {
        "id": "s",
        "name": "S",
        "description": "City Train",
        "priority": 23,
        "vehicle": "TRAIN",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#008000"
        }
    },
    {
        "id": "t",
        "name": "T",
        "description": "Tram",
        "priority": 25,
        "vehicle": "TRAIN",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#808000"
        }
    },
    {
        "id": "tgv",
        "name": "TGV",
        "description": "Train à grande vitesse",
        "priority": 6,
        "vehicle": "TRAIN",
        "classification": "LONG_DISTANCE",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#811863"
        }
    },
    {
        "id": "u",
        "name": "U",
        "description": "Underground Train",
        "priority": 23,
        "vehicle": "TRAIN",
        "classification": "REGIONAL",
        "color": {
            "textColor": "#ffffff",
            "backgroundColor": "#0000a0"
        }
    }
];

----------
-- User --
----------

DEFINE TABLE OVERWRITE User SCHEMAFULL
	PERMISSIONS
		FOR select, update, delete WHERE id = $auth.id;

DEFINE FIELD OVERWRITE name ON User TYPE string;
DEFINE FIELD OVERWRITE email ON User TYPE string ASSERT string::is::email($value);
DEFINE FIELD OVERWRITE password ON User TYPE string VALUE crypto::argon2::generate($value);

DEFINE INDEX OVERWRITE name ON User FIELDS name UNIQUE;
DEFINE INDEX OVERWRITE email ON User FIELDS email UNIQUE;

DEFINE ACCESS OVERWRITE User ON DATABASE TYPE RECORD
	SIGNIN (
		SELECT * FROM User WHERE name = $name AND crypto::argon2::compare(password, $password)
	)
	SIGNUP (
		CREATE User CONTENT {
			name: $name,
			email: $email,
			password: crypto::argon2::generate($password)
		}
	);

INSERT INTO User [
    {
        "name": 'guest',
        "email": 'guest@pis.derzauberer.eu',
        "password": 'guest'
    }
];