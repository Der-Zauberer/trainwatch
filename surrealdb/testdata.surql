DELETE connects;
DELETE visits;

UPSERT timetable:test CONTENT {
    name: "Test"
};

UPSERT route:seehas CONTENT {
    name: "seehas",
    designations: [{ number: '6', type: type:s }],
    timetable: timetable:test
};

UPSERT line:4toxj3td6zswrxcd0bm0 CONTENT {
    route: route:seehas,
};

UPSERT journey:4toxj3td6zswrxcd0bm0 CONTENT {
    line: line:4toxj3td6zswrxcd0bm0,
};

RELATE line:4toxj3td6zswrxcd0bm0 -> connects -> stop:engen CONTENT {
    arrival: { time: d'0000-01-01T07:43:00Z', platform: '1' },
    departure: { time: d'0000-01-01T07:48:00Z', platform: '1' }
};

RELATE journey:4toxj3td6zswrxcd0bm0 -> visits -> stop:engen CONTENT {
    sceduled: type::record((SELECT id FROM connects)[0].id),
    realtime: {
        arrival: { time: d'0000-01-01T07:43:00Z', platform: '1' },
        departure: { time: d'0000-01-01T07:48:00Z',  platform: '1' }
    }
};

RELATE line:4toxj3td6zswrxcd0bm0 -> connects -> stop:welschingen_neuhausen CONTENT {
    arrival: { time: d'0000-01-01T07:51:00Z', platform: '1' },
    departure: { time: d'0000-01-01T07:51:00Z', platform: '1' }
};

RELATE journey:4toxj3td6zswrxcd0bm0 -> visits -> stop:welschingen_neuhausen CONTENT {
    sceduled: type::record((SELECT id FROM connects)[1].id),
    realtime: {
        arrival: { time: d'0000-01-01T07:51:00Z', platform: '1' },
        departure: { time: d'0000-01-01T07:51:00Z',  platform: '1' }
    }
};

RELATE line:4toxj3td6zswrxcd0bm0 -> connects -> stop:muehlhausen_b_engen  CONTENT {
    arrival: { time: d'0000-01-01T07:54:00Z', platform: '1' },
    departure: { time: d'0000-01-01T07:54:00Z', platform: '1' }
};

RELATE journey:4toxj3td6zswrxcd0bm0 -> visits -> stop:muehlhausen_b_engen  CONTENT {
    sceduled: type::record((SELECT id FROM connects)[2].id),
    realtime: {
        arrival: { time: d'0000-01-01T07:54:00Z', platform: '1' },
        departure: { time: d'0000-01-01T07:54:00Z',  platform: '1' }
    }
};

RELATE line:4toxj3td6zswrxcd0bm0 -> connects -> stop:singen_hohentwiel  CONTENT {
    arrival: { time: d'0000-01-01T08:01:00Z', platform: '2' },
    departure: { time: d'0000-01-01T08:01:00Z', platform: '2' }
};

RELATE journey:4toxj3td6zswrxcd0bm0 -> visits -> stop:singen_hohentwiel  CONTENT {
    sceduled: type::record((SELECT id FROM connects)[3].id),
    realtime: {
        arrival: { time: d'0000-01-01T08:01:00Z', platform: '2' },
        departure: { time: d'0000-01-01T08:01:00Z',  platform: '2' }
    }
};

UPSERT route:schwarzwaldbahn CONTENT {
    name: "Schwarzwaldbahn",
    designations: [{ number: '2', type: type:re }],
    timetable: timetable:test
};

UPSERT line:4toxj3td6zswrxcd0bm1 CONTENT {
    route: route:schwarzwaldbahn,
};

UPSERT journey:4toxj3td6zswrxcd0bm1 CONTENT {
    line: line:4toxj3td6zswrxcd0bm1,
};

RELATE line:4toxj3td6zswrxcd0bm1 -> connects -> stop:engen CONTENT {
    arrival: { time: d'0000-01-01T07:06:00Z', platform: '2' },
    departure: { time: d'0000-01-01T07:06:00Z', platform: '2' }
};

RELATE journey:4toxj3td6zswrxcd0bm1 -> visits -> stop:engen CONTENT {
    sceduled: type::record((SELECT id FROM connects)[1].id),
    realtime: {
        arrival: { time: d'0000-01-01T07:06:00Z', platform: '2' },
        departure: { time: d'0000-01-01T07:06:00Z',  platform: '2' }
    }
};

RELATE line:4toxj3td6zswrxcd0bm1 -> connects -> stop:singen_hohentwiel CONTENT {
    arrival: { time: d'0000-01-01T07:23:00Z', platform: '2' },
    departure: { time: d'0000-01-01T07:24:00Z', platform: '2' }
};

RELATE journey:4toxj3td6zswrxcd0bm1 -> visits -> stop:singen_hohentwiel CONTENT {
    sceduled: type::record((SELECT id FROM connects)[2].id),
    realtime: {
        arrival: { time: d'0000-01-01T07:23:00Z', platform: '2' },
        departure: { time: d'0000-01-01T07:24:00Z',  platform: '2' }
    }
};

RELATE line:4toxj3td6zswrxcd0bm1 -> connects -> stop:radolfzell CONTENT {
    arrival: { time: d'0000-01-01T07:34:00Z', platform: '5' },
    departure: { time: d'0000-01-01T07:37:00Z', platform: '5' }
};

RELATE journey:4toxj3td6zswrxcd0bm1 -> visits -> stop:radolfzell CONTENT {
    sceduled: type::record((SELECT id FROM connects)[3].id),
    realtime: {
        arrival: { time: d'0000-01-01T07:34:00Z', platform: '5' },
        departure: { time: d'0000-01-01T07:37:00Z',  platform: '5' }
    }
};