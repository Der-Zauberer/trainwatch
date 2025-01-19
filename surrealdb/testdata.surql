DELETE connects;
DELETE visits;

UPSERT route:seehas CONTENT {
    name: "seehas",
    designations: [{ number: '6', type: type:s }]
};

UPSERT line:4toxj3td6zswrxcd0bm0 CONTENT {
    route: route:seehas,
};

RELATE line:4toxj3td6zswrxcd0bm0 -> connects -> stop:engen CONTENT {
    arrival: { time: d'0000-01-01T07:43:00Z', platform: '1' },
    departure: { time: d'0000-01-01T07:54:00Z', platform: '1' }
};

UPSERT journey:4toxj3td6zswrxcd0bm0 CONTENT {
    line: line:4toxj3td6zswrxcd0bm0,
};

RELATE journey:4toxj3td6zswrxcd0bm0 -> visits -> stop:engen CONTENT {
    sceduled: type::record((SELECT id FROM connects)[0].id),
    realtime: {
        arrival: { time: d'0000-01-01T07:43:00Z', platform: '1' },
        departure: { time: d'0000-01-01T07:54:00Z',  platform: '1' }
    }
};

UPSERT route:schwarzwaldbahn CONTENT {
    name: "Schwarzwaldbahn",
    designations: [{ number: '2', type: type:re }]
};

UPSERT line:4toxj3td6zswrxcd0bm1 CONTENT {
    route: route:schwarzwaldbahn,
};

RELATE line:4toxj3td6zswrxcd0bm1 -> connects -> stop:engen CONTENT {
    arrival: { time: d'0000-01-01T07:06:00Z', platform: '1' },
    departure: { time: d'0000-01-01T07:06:00Z', platform: '1' }
};

UPSERT journey:4toxj3td6zswrxcd0bm1 CONTENT {
    line: line:4toxj3td6zswrxcd0bm1,
};

RELATE journey:4toxj3td6zswrxcd0bm1 -> visits -> stop:engen CONTENT {
    sceduled: type::record((SELECT id FROM connects)[1].id),
    realtime: {
        arrival: { time: d'0000-01-01T07:06:00Z', platform: '1' },
        departure: { time: d'0000-01-01T07:06:00Z',  platform: '1' }
    }
};