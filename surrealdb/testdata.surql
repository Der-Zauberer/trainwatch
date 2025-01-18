UPSERT route:seehas CONTENT {
    name: "seehas",
    designations: [
        {
            number: 6,
            type: type:s
        }
    ]
};

UPSERT line:4toxj3td6zswrxcd0bm0 CONTENT {
    route: route:seehas,
};

DELETE connects;
RELATE line:4toxj3td6zswrxcd0bm0 -> connects -> stop:engen CONTENT {
    arrival: {
        time: d'0000-01-01T07:43:00Z',
        platform: '1'
    },
    departure: {
        time: d'0000-01-01T07:54:00Z',
        platform: '1'
    }
};

UPSERT journey:4toxj3td6zswrxcd0bm0 CONTENT {
    line: line:4toxj3td6zswrxcd0bm0,
};

DELETE visits;
RELATE journey:4toxj3td6zswrxcd0bm0 -> visits -> stop:engen CONTENT {
    sceduled: type::record((SELECT id FROM connects)[0].id),
    realtime: {
        arrival: {
            time: d'0000-01-01T07:43:00Z',
            platform: '1'
        },
        departure: {
            time: d'0000-01-01T07:54:00Z',
            platform: '1'
        }
    }
};