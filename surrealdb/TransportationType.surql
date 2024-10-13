DEFINE TABLE IF NOT EXISTS TransportationType SCHEMAFULL;
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
]