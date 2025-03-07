---------------
-- functions --
---------------

DEFINE ANALYZER OVERWRITE blank TOKENIZERS blank;
DEFINE ANALYZER OVERWRITE edgengram FILTERS edgengram(1,100);

DEFINE FUNCTION OVERWRITE fn::search::normalize($name: string, $seperator: option<string>) {
    LET $result = $name.lowercase().replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').slug();
    IF ($seperator != NONE && $seperator != '-') {
        RETURN string::replace($result, '-', $seperator);
    };
    RETURN $result;
};

DEFINE FUNCTION OVERWRITE fn::search::extract_ids($object: object) {
    RETURN $object.values().flatten().map(|$id| type::string($id).lowercase());
};

DEFINE FUNCTION OVERWRITE fn::search::n_word_edge_ngram($name: string) {
    LET $tokens = search::analyze('blank', $name);
    LET $parts = array::fold((<array> 0..$tokens.len()), { all: $tokens, entries: [] }, |$meta, $index| {
        RETURN { all: $meta.all, entries: $meta.entries.push(array::slice($meta.all, $index).join('')) };
    }).entries;
    RETURN $parts.map(|$part| search::analyze('edgengram', $part)).flatten().distinct();
};

DEFINE FUNCTION OVERWRITE fn::search::search($name: string) {
    RETURN array::flatten(SELECT VALUE entries.{id, name} AS result FROM type::thing('search', fn::search::normalize($name, '')));
};

----------
-- stop --
----------

DEFINE TABLE OVERWRITE stop SCHEMAFULL
	PERMISSIONS
		FOR select FULL;
DEFINE FIELD OVERWRITE id ON TABLE stop;
DEFINE FIELD OVERWRITE name ON TABLE stop TYPE string;
DEFINE FIELD OVERWRITE score ON TABLE stop TYPE int DEFAULT 9;
DEFINE FIELD OVERWRITE platforms ON TABLE stop TYPE array<object>;
DEFINE FIELD OVERWRITE platforms[*].name ON TABLE stop TYPE string;
DEFINE FIELD OVERWRITE platforms[*].length ON TABLE stop TYPE float;
DEFINE FIELD OVERWRITE platforms[*].height ON TABLE stop TYPE int;
DEFINE FIELD OVERWRITE platforms[*].linkedPlatforms ON TABLE stop TYPE array<string>;
DEFINE FIELD OVERWRITE location ON TABLE stop TYPE object;
DEFINE FIELD OVERWRITE location.latitude ON TABLE stop TYPE option<float>;
DEFINE FIELD OVERWRITE location.longitude ON TABLE stop TYPE option<float>;
DEFINE FIELD OVERWRITE address ON TABLE stop TYPE option<object>;
DEFINE FIELD OVERWRITE address.street ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE address.zipcode ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE address.city ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE address.federalState ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE address.country ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE address.email ON TABLE operator TYPE option<string>;
DEFINE FIELD OVERWRITE address.phone ON TABLE operator TYPE option<string>;
DEFINE FIELD OVERWRITE open ON TABLE stop TYPE option<object>;
DEFINE FIELD OVERWRITE open.monday ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE open.tuesday ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE open.wednesday ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE open.thursday ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE open.friday ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE open.saturday ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE open.sunday ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE services ON TABLE stop TYPE object;
DEFINE FIELD OVERWRITE services.parking ON TABLE stop TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE services.localPublicTransport ON TABLE stop TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE services.carRental ON TABLE stop TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE services.taxi ON TABLE stop TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE services.publicFacilities ON TABLE stop TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE services.travelNecessities ON TABLE stop TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE services.locker ON TABLE stop TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE services.wifi ON TABLE stop TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE services.information ON TABLE stop TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE services.railwayMission ON TABLE stop TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE services.lostAndFound ON TABLE stop TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE services.barrierFree ON TABLE stop TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE services.mobilityService ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE ids ON TABLE stop TYPE option<object>;
DEFINE FIELD OVERWRITE ids.uic ON TABLE stop TYPE option<int>;
DEFINE FIELD OVERWRITE ids.ril ON TABLE stop TYPE option<array<string>>;
DEFINE FIELD OVERWRITE ids.stada ON TABLE stop TYPE option<int>;
DEFINE FIELD OVERWRITE sources ON TABLE stop TYPE option<array<object>>;
DEFINE FIELD OVERWRITE sources[*].name ON TABLE stop TYPE string;
DEFINE FIELD OVERWRITE sources[*].license ON TABLE stop TYPE string;
DEFINE FIELD OVERWRITE sources[*].url ON TABLE stop TYPE string ASSERT string::is::url($value);
DEFINE FIELD OVERWRITE sources[*].updated ON TABLE stop TYPE string;

DEFINE TABLE OVERWRITE search SCHEMAFULL
	PERMISSIONS
		FOR select FULL;
DEFINE FIELD OVERWRITE entries ON TABLE search TYPE array<object>;
DEFINE FIELD OVERWRITE entries[*].id ON TABLE search TYPE record<stop>;
DEFINE FIELD OVERWRITE entries[*].name ON TABLE search TYPE string;
DEFINE FIELD OVERWRITE entries[*].score ON TABLE search TYPE number;

DEFINE EVENT OVERWRITE stop_update ON TABLE stop WHEN $before.name != $after.name || $before.ids != $after.ids THEN {
    IF $before THEN {
        FOR $entry IN fn::search::extract_ids($before.ids) {
            UPDATE type::thing('search', $entry) SET entries = entries.filter(|$v| $v.id = $before.id);
            DELETE type::thing('search', $entry) WHERE array::is_empty(entries);
        };
        FOR $entry IN fn::search::n_word_edge_ngram(fn::search::normalize($before.name, ' ')) {
            UPDATE type::thing('search', $entry) SET entries = entries.filter(|$v| $v.id = $before.id);
            DELETE type::thing('search', $entry) WHERE array::is_empty(entries);
        };
    } END;
    IF $after THEN {
        FOR $entry IN fn::search::extract_ids($after.ids) {
            UPSERT ONLY type::thing('search', $entry) SET id = $entry, entries += { id: $after.id, name: $after.name, score: $after.score };
            UPDATE ONLY type::thing('search', $entry) SET entries = fn::search::sort_beginn_score_matching($entry, entries);
        };
        LET $search = fn::search::normalize($stop.name, '');
        FOR $entry IN fn::search::n_word_edge_ngram(fn::search::normalize($after.name, ' ')) {
            LET $score = IF string::starts_with($search, $entry) { 10 } ELSE { 20 };
            UPSERT ONLY type::thing('search', $entry) SET id = $entry, entries += { id: $after.id, name: $after.name, score: $after.score + $score };
            UPDATE ONLY type::thing('search', $entry) SET entries = (SELECT * FROM $parent.entries ORDER BY score);
        };
    } END;
};

DEFINE FUNCTION OVERWRITE fn::stop::index() {
    DELETE search;
    FOR $stop IN (SELECT id, name, score, ids FROM stop) {
        FOR $entry IN fn::search::extract_ids($stop.ids) {
            UPSERT ONLY type::thing('search', $entry) SET id = $entry, entries += { id: $stop.id, name: $stop.name, score: $stop.score };
        };
        LET $search = fn::search::normalize($stop.name, '');
        FOR $entry IN fn::search::n_word_edge_ngram(fn::search::normalize($stop.name, ' ')) {
            LET $score = IF string::starts_with($search, $entry) { 10 } ELSE { 20 };
            UPSERT ONLY type::thing('search', $entry) SET id = $entry, entries += { id: $stop.id, name: $stop.name, score: $stop.score + $score };
        };
    };
    UPDATE search SET entries = (SELECT * FROM $parent.entries ORDER BY score);
};

----------
-- type --
----------

DEFINE TABLE OVERWRITE type SCHEMAFULL
	PERMISSIONS
		FOR select FULL;
DEFINE FIELD OVERWRITE id ON TABLE type;
DEFINE FIELD OVERWRITE name ON TABLE type TYPE string;
DEFINE FIELD OVERWRITE description ON TABLE type TYPE string;
DEFINE FIELD OVERWRITE priority ON TABLE type TYPE int;
DEFINE FIELD OVERWRITE color ON TABLE type TYPE object;
DEFINE FIELD OVERWRITE color.text ON TABLE type TYPE string;
DEFINE FIELD OVERWRITE color.background ON TABLE type TYPE string;
DEFINE FIELD OVERWRITE vehicle ON TABLE type TYPE 'TRAIN' | 'BUS' | 'SHIP' | 'PLANE';
DEFINE FIELD OVERWRITE classification ON TABLE type TYPE 'REGIONAL' | 'LONG_DISTANCE';

INSERT INTO type [
    {
        id: "ast",
        name: "AST",
        description: "Anruf-Sammel-Taxi",
        priority: 29,
        vehicle: "BUS",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#808000"
        }
    },
    {
        id: "b",
        name: "BUS",
        description: "Bus",
        priority: 26,
        vehicle: "BUS",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#7f7f7f"
        }
    },
    {
        id: "cb",
        name: "CB",
        description: "City Bus",
        priority: 27,
        vehicle: "BUS",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#808000"
        }
    },
    {
        id: "cjx",
        name: "CJX",
        description: "Cityjet Xpress",
        priority: 16,
        vehicle: "TRAIN",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#ff0000"
        }
    },
    { 
        id: "ec",
        name: "EC",
        description: "Eurocity",
        priority: 1,
        vehicle: "TRAIN",
        classification: "LONG_DISTANCE",
        color: {
            text: "#ffff00",
            background: "#0000ff"
        }
    },
    {
        id: "ece",
        name: "ECE",
        description: "Eurocity Express",
        priority: 0,
        vehicle: "TRAIN",
        classification: "LONG_DISTANCE",
        color: {
            text: "#ffff00",
            background: "#0000ff"
        }
    },
    {
        id: "en",
        name: "EN",
        description: "EuroNight",
        priority: 10,
        vehicle: "TRAIN",
        classification: "LONG_DISTANCE",
        color: {
            text: "#ffffff",
            background: "#0000ff"
        }
    },
    { 
        id: "fex",
        name: "FEX",
        description: "Airport Express",
        vehicle: "TRAIN",
        priority: 21,
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#ff0000"
        }
    },
    {
        id: "d",
        name: "D",
        description: "Express",
        priority: 8,
        vehicle: "TRAIN",
        classification: "LONG_DISTANCE",
        color: {
            text: "#ffffff",
            background: "#7f7f7f"
        }
    },
    {
        id: "dn",
        name: "DN",
        description: "Night Express",
        priority: 8,
        vehicle: "TRAIN",
        classification: "LONG_DISTANCE",
        color: {
            text: "#ffffff",
            background: "#0000ff"
        }
    },
    {
        id: "ic",
        name: "IC",
        description: "Intercity",
        priority: 7,
        vehicle: "TRAIN",
        classification: "LONG_DISTANCE",
        color: {
            text: "#ff0000",
            background: "#ffffff"
        }
    },
    {
        id: "ice",
        name: "ICE",
        description: "Intercity Express",
        priority: 6,
        vehicle: "TRAIN",
        classification: "LONG_DISTANCE",
        color: {
            text: "#ff0000",
            background: "#ffffff"
        }
    },
    {
        id: "ices",
        name: "ICEs",
        description: "Intercity Express Sprinter",
        priority: 5,
        vehicle: "TRAIN",
        classification: "LONG_DISTANCE",
        color: {
            text: "#ff0000",
            background: "#ffffff"
        }
    },
    {
        id: "ir",
        name: "IR",
        description: "Interregio",
        priority: 15,
        vehicle: "TRAIN",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#0080ff"
        }
    },
    {
        id: "ire",
        name: "IRE",
        description: "Interregio Express",
        priority: 16,
        vehicle: "TRAIN",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#ff0000"
        }
    },
    {
        id: "nj",
        name: "NJ",
        description: "Nightjet",
        priority: 11,
        vehicle: "TRAIN",
        classification: "LONG_DISTANCE",
        color: {
            text: "#ffffff",
            background: "#0000ff"
        }
    },
    {
        id: "nl",
        name: "NL",
        description: "Nightliner",
        priority: 25,
        vehicle: "TRAIN",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#0000ff"
        }
    },
    {
        id: "mex",
        name: "MEX",
        description: "Metropolitan Express",
        priority: 20,
        vehicle: "TRAIN",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#ff0000"
        }
    },
    {
        id: "rgj",
        name: "RJG",
        description: "RegioJet",
        priority: 7,
        vehicle: "TRAIN",
        classification: "LONG_DISTANCE",
        color: {
            text: "#ff0000",
            background: "#ffff00"
        }
    },
    {
        id: "rj",
        name: "RJ",
        description: "Railjet",
        priority: 6,
        vehicle: "TRAIN",
        classification: "LONG_DISTANCE",
        color: {
            text: "#ffffff",
            background: "#cd3030"
        }
    },
    {
        id: "rjx",
        name: "RJX",
        description: "Railjet Xpress",
        priority: 5,
        vehicle: "TRAIN",
        classification: "LONG_DISTANCE",
        color: {
            text: "#ffffff",
            background: "#cd3030"
        }
    },
    {
        id: "re",
        name: "RE",
        description: "Regionalexpress",
        priority: 17,
        vehicle: "TRAIN",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#ff0000"
        }
    },
    {
        id: "rex",
        name: "RE",
        description: "RegionalExpress",
        priority: 17,
        vehicle: "TRAIN",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#ff0000"
        }
    },
    {
        id: "rb",
        name: "RB",
        description: "Regionalbahn",
        priority: 22,
        vehicle: "TRAIN",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#ff0000"
        }
    },
    {
        id: "ruf",
        name: "RUF",
        description: "Rufbus",
        priority: 28,
        vehicle: "BUS",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#808000"
        }
    },
    {
        id: "s",
        name: "S",
        description: "City Train",
        priority: 23,
        vehicle: "TRAIN",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#008000"
        }
    },
    {
        id: "t",
        name: "T",
        description: "Tram",
        priority: 25,
        vehicle: "TRAIN",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#808000"
        }
    },
    {
        id: "tgv",
        name: "TGV",
        description: "Train à grande vitesse",
        priority: 6,
        vehicle: "TRAIN",
        classification: "LONG_DISTANCE",
        color: {
            text: "#ffffff",
            background: "#811863"
        }
    },
    {
        id: "u",
        name: "U",
        description: "Underground Train",
        priority: 23,
        vehicle: "TRAIN",
        classification: "REGIONAL",
        color: {
            text: "#ffffff",
            background: "#0000a0"
        }
    }
];

--------------
-- operator --
--------------

DEFINE TABLE OVERWRITE operator SCHEMAFULL
    PERMISSIONS
        FOR select FULL;
DEFINE FIELD OVERWRITE id ON TABLE operator;
DEFINE FIELD OVERWRITE name ON TABLE operator TYPE string;
DEFINE FIELD OVERWRITE address ON TABLE operator TYPE option<object>;
DEFINE FIELD OVERWRITE address.street ON TABLE operator TYPE option<string>;
DEFINE FIELD OVERWRITE address.zipcode ON TABLE operator TYPE option<string>;
DEFINE FIELD OVERWRITE address.city ON TABLE operator TYPE option<string>;
DEFINE FIELD OVERWRITE address.federalState ON TABLE operator TYPE option<string>;
DEFINE FIELD OVERWRITE address.country ON TABLE operator TYPE option<string>;
DEFINE FIELD OVERWRITE address.email ON TABLE operator TYPE option<string>;
DEFINE FIELD OVERWRITE address.phone ON TABLE operator TYPE option<string>;
DEFINE FIELD OVERWRITE website ON TABLE operator TYPE option<string> ASSERT string::is::url($value);

-----------
-- route --
-----------

DEFINE TABLE OVERWRITE route TYPE NORMAL SCHEMAFULL
	PERMISSIONS
		FOR select FULL;
DEFINE FIELD OVERWRITE id ON TABLE route;
DEFINE FIELD OVERWRITE name ON TABLE route TYPE option<string>;
DEFINE FIELD OVERWRITE designations ON TABLE route TYPE array<object>;
DEFINE FIELD OVERWRITE designations[*].type ON TABLE route TYPE record<type>;
DEFINE FIELD OVERWRITE designations[*].number ON TABLE route TYPE string;
DEFINE FIELD OVERWRITE operator ON TABLE route TYPE option<record<operator>>;

-----------
-- line --
-----------

DEFINE TABLE OVERWRITE line SCHEMAFULL
	PERMISSIONS
		FOR select FULL;
DEFINE FIELD OVERWRITE id ON TABLE line;
DEFINE FIELD OVERWRITE route ON TABLE line TYPE record<route>;

DEFINE TABLE OVERWRITE connects SCHEMAFULL TYPE RELATION
    PERMISSIONS
        FOR select FULL;
DEFINE FIELD OVERWRITE id ON TABLE connects;
DEFINE FIELD OVERWRITE in ON TABLE connects TYPE record<line>;
DEFINE FIELD OVERWRITE out ON TABLE connects TYPE record<stop>;
DEFINE FIELD OVERWRITE arrival ON TABLE connects TYPE object;
DEFINE FIELD OVERWRITE arrival.time ON TABLE connects TYPE datetime;
DEFINE FIELD OVERWRITE arrival.platform ON TABLE connects TYPE string;
DEFINE FIELD OVERWRITE departure ON TABLE connects TYPE object;
DEFINE FIELD OVERWRITE departure.time ON TABLE connects TYPE datetime;
DEFINE FIELD OVERWRITE departure.platform ON TABLE connects TYPE string;

-------------
-- journey --
-------------

DEFINE TABLE OVERWRITE journey SCHEMAFULL
	PERMISSIONS
		FOR select FULL;
DEFINE FIELD OVERWRITE id ON TABLE journey;
DEFINE FIELD OVERWRITE line ON TABLE journey TYPE record<line>;

DEFINE TABLE OVERWRITE visits SCHEMAFULL TYPE RELATION
    PERMISSIONS
        FOR select FULL;
DEFINE FIELD OVERWRITE id ON TABLE visits;
DEFINE FIELD OVERWRITE in ON TABLE visits TYPE record<journey>;
DEFINE FIELD OVERWRITE out ON TABLE visits TYPE record<stop>;
DEFINE FIELD OVERWRITE sceduled ON TABLE visits TYPE record<connects>;
DEFINE FIELD OVERWRITE realtime ON TABLE visits TYPE object;
DEFINE FIELD OVERWRITE realtime.arrival ON TABLE visits TYPE object;
DEFINE FIELD OVERWRITE realtime.arrival.time ON TABLE visits TYPE datetime;
DEFINE FIELD OVERWRITE realtime.arrival.platform ON TABLE visits TYPE string;
DEFINE FIELD OVERWRITE realtime.departure ON TABLE visits TYPE object;
DEFINE FIELD OVERWRITE realtime.departure.time ON TABLE visits TYPE datetime;
DEFINE FIELD OVERWRITE realtime.departure.platform ON TABLE visits TYPE string;

----------
-- role --
----------

DEFINE TABLE OVERWRITE role SCHEMAFULL
	PERMISSIONS
		FOR select FULL;
DEFINE FIELD OVERWRITE id ON TABLE role;
DEFINE FIELD OVERWRITE name ON role TYPE string;
DEFINE FIELD OVERWRITE permissions ON TABLE user TYPE array<string>;

UPSERT role:admin CONTENT {
    name: 'admin',
    permissions: []
};

----------
-- user --
----------

DEFINE TABLE OVERWRITE user SCHEMAFULL
	PERMISSIONS
		FOR select, update, delete WHERE id = $auth.id;
DEFINE FIELD OVERWRITE id ON TABLE user;
DEFINE FIELD OVERWRITE name ON TABLE user TYPE string;
DEFINE FIELD OVERWRITE email ON TABLE user TYPE string ASSERT string::is::email($value);
DEFINE FIELD OVERWRITE password ON TABLE user TYPE string VALUE crypto::argon2::generate($value);
DEFINE FIELD OVERWRITE roles ON TABLE user TYPE array<record<role>>;
DEFINE FIELD OVERWRITE permissions ON TABLE user TYPE array<string>;
DEFINE INDEX OVERWRITE name ON user FIELDS name UNIQUE;
DEFINE INDEX OVERWRITE email ON user FIELDS email UNIQUE;

DEFINE ACCESS OVERWRITE user ON DATABASE TYPE RECORD
	SIGNIN (
		SELECT * FROM user WHERE name = $name AND crypto::argon2::compare(password, $password)
	)
	SIGNUP (
		CREATE user CONTENT {
			name: $name,
			email: $email,
			password: crypto::argon2::generate($password),
            roles: [],
            permissions: []
		}
	);

INSERT INTO user {
    name: 'guest',
    email: 'guest@trainwatch.derzauberer.eu',
    password: 'guest',
    roles: [],
    permissions: []
};