---------------
-- functions --
---------------

DEFINE FUNCTION OVERWRITE fn::search::normalize($name: string, $seperator: option<string>) {
    LET $result = $name.lowercase().replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').slug();
    IF ($seperator != NONE && $seperator != '-') {
        RETURN string::replace($result, '-', $seperator);
    };
    RETURN $result;
};

DEFINE FUNCTION OVERWRITE fn::search::trails($name: string) {
    LET $word = string::split($name, ' ');

    RETURN array::map(array::range(0, array::len($word)), |$index| {
        array::join(array::slice($word, $index, array::len($word)), ' ')
    });
};

DEFINE FUNCTION OVERWRITE fn::search::extract_ids($object: option<object>) {
    IF $object == NONE { RETURN [] };
    RETURN $object.values().flatten().map(|$id| type::string($id));
};

----------
-- stop --
----------

DEFINE TABLE OVERWRITE stop SCHEMAFULL
	PERMISSIONS
		FOR select FULL,
        FOR create, update, delete WHERE fn::user::has_permission($auth, 'studio.stop');
DEFINE FIELD OVERWRITE id ON TABLE stop TYPE string;
DEFINE FIELD OVERWRITE name ON TABLE stop TYPE string;
DEFINE FIELD OVERWRITE score ON TABLE stop TYPE int DEFAULT 9;
DEFINE FIELD OVERWRITE platforms ON TABLE stop TYPE array<object> DEFAULT [];
DEFINE FIELD OVERWRITE platforms[*].name ON TABLE stop TYPE string;
DEFINE FIELD OVERWRITE platforms[*].length ON TABLE stop TYPE float;
DEFINE FIELD OVERWRITE platforms[*].height ON TABLE stop TYPE int;
DEFINE FIELD OVERWRITE platforms[*].linkedPlatforms ON TABLE stop TYPE array<string> DEFAULT [];
DEFINE FIELD OVERWRITE location ON TABLE stop TYPE option<object>;
DEFINE FIELD OVERWRITE location.latitude ON TABLE stop TYPE float;
DEFINE FIELD OVERWRITE location.longitude ON TABLE stop TYPE float;
DEFINE FIELD OVERWRITE address ON TABLE stop TYPE option<object>;
DEFINE FIELD OVERWRITE address.street ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE address.zipcode ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE address.city ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE address.federalState ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE address.country ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE address.email ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE address.phone ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE open ON TABLE stop TYPE option<object>;
DEFINE FIELD OVERWRITE open.monday ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE open.tuesday ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE open.wednesday ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE open.thursday ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE open.friday ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE open.saturday ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE open.sunday ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE services ON TABLE stop TYPE object DEFAULT {};
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
DEFINE FIELD OVERWRITE services.mobilityService ON TABLE stop TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE ids ON TABLE stop TYPE option<object>;
DEFINE FIELD OVERWRITE ids.uic ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE ids.ril ON TABLE stop TYPE option<array<string>>;
DEFINE FIELD OVERWRITE ids.stada ON TABLE stop TYPE option<string>;
DEFINE FIELD OVERWRITE sources ON TABLE stop TYPE option<array<object>>;
DEFINE FIELD OVERWRITE sources[*].name ON TABLE stop TYPE string;
DEFINE FIELD OVERWRITE sources[*].license ON TABLE stop TYPE string;
DEFINE FIELD OVERWRITE sources[*].url ON TABLE stop TYPE string;
DEFINE FIELD OVERWRITE sources[*].updated ON TABLE stop TYPE string;

DEFINE TABLE OVERWRITE stop_search SCHEMAFULL
	PERMISSIONS
		FOR select FULL,
        FOR create, update, delete WHERE fn::user::has_permission($auth, 'studio.stop');
DEFINE FIELD OVERWRITE id ON TABLE stop_search TYPE string;
DEFINE FIELD OVERWRITE token ON TABLE stop_search TYPE string;
DEFINE FIELD OVERWRITE stop ON TABLE stop_search TYPE record<stop> REFERENCE ON DELETE CASCADE;
DEFINE FIELD OVERWRITE score ON TABLE stop_search TYPE int;

DEFINE INDEX userEmailIndex ON TABLE stop_search COLUMNS token;

DEFINE EVENT OVERWRITE stop_update ON TABLE stop WHEN $before.name != $after.name || $before.ids != $after.ids THEN {
    IF $before THEN {
        DELETE $before<~stop_search
    } END;
    IF $after THEN {
        LET $search = fn::search::normalize($after.name, ' ');
        FOR $token IN fn::search::trails(fn::search::normalize($after.name, ' ')) {
            LET $score = IF string::starts_with($search, $token) { 10 } ELSE { 20 };
            INSERT INTO stop_search { token: $token, stop: $after.id, score: $after.score + $score }
        };
        FOR $id IN fn::search::extract_ids($stop.ids) {
            INSERT INTO stop_search { token: $id, stop: $after.id, score: $after.score }
        };
    } END;
};

DEFINE FUNCTION OVERWRITE fn::stop::index() {
    DELETE stop_search;
    FOR $stop IN (SELECT id, name, score, ids FROM stop) {
        LET $search = fn::search::normalize($stop.name, ' ');
        FOR $token IN fn::search::trails(fn::search::normalize($stop.name, ' ')) {
            LET $score = IF string::starts_with($search, $token) { 10 } ELSE { 20 };
            INSERT INTO stop_search { token: $token, stop: $stop.id, score: $stop.score + $score }
        };
        FOR $id IN fn::search::extract_ids($stop.ids) {
            INSERT INTO stop_search { token: $id, stop: $stop.id, score: $stop.score }
        };
    };
};

DEFINE FUNCTION OVERWRITE fn::search::search($name: string) {
    array::distinct(array::flatten([ 
        (SELECT stop, score FROM stop_search WHERE token = $name ORDER BY score).stop, 
        (SELECT stop, score FROM stop_search WHERE string::starts_with(token, string::lowercase($name)) ORDER BY score).stop, 
    ]));
};

----------
-- type --
----------

DEFINE TABLE OVERWRITE type SCHEMAFULL
	PERMISSIONS
		FOR select FULL,
        FOR create, update, delete WHERE fn::user::has_permission($auth, 'studio.type');
DEFINE FIELD OVERWRITE id ON TABLE type TYPE string;
DEFINE FIELD OVERWRITE name ON TABLE type TYPE string;
DEFINE FIELD OVERWRITE description ON TABLE type TYPE string;
DEFINE FIELD OVERWRITE priority ON TABLE type TYPE int;
DEFINE FIELD OVERWRITE color ON TABLE type TYPE object;
DEFINE FIELD OVERWRITE color.text ON TABLE type TYPE string;
DEFINE FIELD OVERWRITE color.background ON TABLE type TYPE string;
DEFINE FIELD OVERWRITE vehicle ON TABLE type TYPE 'TRAIN' | 'BUS' | 'SHIP' | 'PLANE';
DEFINE FIELD OVERWRITE classification ON TABLE type TYPE 'REGIONAL' | 'LONG_DISTANCE';

INSERT IGNORE INTO type [
    { id: 'ast', name: 'AST', description: 'Anruf-Sammel-Taxi', priority: 29, vehicle: 'BUS', classification: 'REGIONAL', color: { text: '#ffffff', background: '#808000' }},
    { id: 'b', name: 'BUS', description: 'Bus', priority: 26, vehicle: 'BUS', classification: 'REGIONAL', color: { text: '#ffffff', background: '#7f7f7f' }},
    { id: 'cb', name: 'CB', description: 'City Bus', priority: 27, vehicle: 'BUS', classification: 'REGIONAL', color: { text: '#ffffff', background: '#808000' }},
    { id: 'cjx', name: 'CJX', description: 'Cityjet Xpress', priority: 16, vehicle: 'TRAIN', classification: 'REGIONAL', color: { text: '#ffffff', background: '#ff0000' }},
    { id: 'ec', name: 'EC', description: 'Eurocity', priority: 1, vehicle: 'TRAIN', classification: 'LONG_DISTANCE', color: { text: '#ffff00', background: '#0000ff' }},
    { id: 'ece', name: 'ECE', description: 'Eurocity Express', priority: 0, vehicle: 'TRAIN', classification: 'LONG_DISTANCE', color: { text: '#ffff00', background: '#0000ff' }},
    { id: 'en', name: 'EN', description: 'EuroNight', priority: 10, vehicle: 'TRAIN', classification: 'LONG_DISTANCE', color: { text: '#ffffff', background: '#0000ff' }},
    { id: 'fex',name: 'FEX', description: 'Airport Express', vehicle: 'TRAIN', priority: 21,classification: 'REGIONAL', color: { text: '#ffffff', background: '#ff0000' }},
    { id: 'd',name: 'D', description: 'Express', priority: 8, vehicle: 'TRAIN', classification: 'LONG_DISTANCE', color: { text: '#ffffff', background: '#7f7f7f' }},
    { id: 'dn',name: 'DN', description: 'Night Express', priority: 8, vehicle: 'TRAIN', classification: 'LONG_DISTANCE', color: { text: '#ffffff', background: '#0000ff' }},
    { id: 'ic',name: 'IC', description: 'Intercity', priority: 7, vehicle: 'TRAIN', classification: 'LONG_DISTANCE', color: { text: '#ff0000', background: '#ffffff' }},
    { id: 'ice',name: 'ICE', description: 'Intercity Express', priority: 6, vehicle: 'TRAIN', classification: 'LONG_DISTANCE',color: { text: '#ff0000', background: '#ffffff' }},
    { id: 'ices',name: 'ICEs', description: 'Intercity Express Sprinter', priority: 5, vehicle: 'TRAIN', classification: 'LONG_DISTANCE',color: { text: '#ff0000', background: '#ffffff' }},
    { id: 'ir',name: 'IR', description: 'Interregio', priority: 15, vehicle: 'TRAIN', classification: 'REGIONAL', color: { text: '#ffffff', background: '#0080ff' }},
    { id: 'ire',name: 'IRE', description: 'Interregio Express', priority: 16, vehicle: 'TRAIN', classification: 'REGIONAL', color: { text: '#ffffff', background: '#ff0000' }},
    { id: 'nj', name: 'NJ', description: 'Nightjet', priority: 11, vehicle: 'TRAIN', classification: 'LONG_DISTANCE', color: { text: '#ffffff', background: '#0000ff' }},
    { id: 'nl', name: 'NL', description: 'Nightliner', priority: 25, vehicle: 'TRAIN', classification: 'REGIONAL', color: { text: '#ffffff', background: '#0000ff' }},
    { id: 'mex', name: 'MEX', description: 'Metropolitan Express', priority: 20, vehicle: 'TRAIN', classification: 'REGIONAL', color: { text: '#ffffff', background: '#ff0000' }},
    { id: 'rgj', name: 'RJG', description: 'RegioJet', priority: 7, vehicle: 'TRAIN', classification: 'LONG_DISTANCE', color: { text: '#ff0000', background: '#ffff00' }},
    { id: 'rj', name: 'RJ', description: 'Railjet', priority: 6, vehicle: 'TRAIN', classification: 'LONG_DISTANCE', color: { text: '#ffffff', background: '#cd3030' }},
    { id: 'rjx', name: 'RJX', description: 'Railjet Xpress', priority: 5, vehicle: 'TRAIN', classification: 'LONG_DISTANCE', color: { text: '#ffffff', background: '#cd3030' }},
    { id: 're', name: 'RE', description: 'Regionalexpress', priority: 17, vehicle: 'TRAIN', classification: 'REGIONAL', color: { text: '#ffffff', background: '#ff0000' }},
    { id: 'rex', name: 'RE', description: 'RegionalExpress', priority: 17, vehicle: 'TRAIN', classification: 'REGIONAL', color: { text: '#ffffff', background: '#ff0000' }},
    { id: 'rb', name: 'RB', description: 'Regionalbahn', priority: 22, vehicle: 'TRAIN', classification: 'REGIONAL', color: { text: '#ffffff', background: '#ff0000' }},
    { id: 'ruf', name: 'RUF', description: 'Rufbus', priority: 28, vehicle: 'BUS', classification: 'REGIONAL', color: { text: '#ffffff', background: '#808000' }},
    { id: 's', name: 'S', description: 'City Train', priority: 23, vehicle: 'TRAIN', classification: 'REGIONAL', color: { text: '#ffffff', background: '#008000' }},
    { id: 't', name: 'T', description: 'Tram', priority: 25, vehicle: 'TRAIN', classification: 'REGIONAL', color: { text: '#ffffff', background: '#808000' }},
    { id: 'tgv', name: 'TGV', description: 'Train à grande vitesse', priority: 6, vehicle: 'TRAIN', classification: 'LONG_DISTANCE', color: { text: '#ffffff', background: '#811863' }},
    { id: 'u', name: 'U', description: 'Underground Train', priority: 23, vehicle: 'TRAIN', classification: 'REGIONAL', color: { text: '#ffffff', background: '#0000a0' }}
];

--------------
-- operator --
--------------

DEFINE TABLE OVERWRITE operator SCHEMAFULL
    PERMISSIONS
        FOR select FULL,
        FOR create, update, delete WHERE fn::user::has_permission($auth, 'studio.operator');
DEFINE FIELD OVERWRITE id ON TABLE operator TYPE string;
DEFINE FIELD OVERWRITE name ON TABLE operator TYPE string;
DEFINE FIELD OVERWRITE address ON TABLE operator TYPE option<object>;
DEFINE FIELD OVERWRITE address.street ON TABLE operator TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE address.zipcode ON TABLE operator TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE address.city ON TABLE operator TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE address.federalState ON TABLE operator TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE address.country ON TABLE operator TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE address.email ON TABLE operator TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE address.phone ON TABLE operator TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE website ON TABLE operator TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });

---------------
-- timetable --
---------------

DEFINE TABLE OVERWRITE timetable TYPE NORMAL SCHEMAFULL
	PERMISSIONS
		FOR select FULL,
        FOR create, update, delete WHERE fn::user::has_permission($auth, 'studio.timetable');
DEFINE FIELD OVERWRITE id ON TABLE timetable TYPE string;
DEFINE FIELD OVERWRITE name ON TABLE timetable TYPE string;

-----------
-- route --
-----------

DEFINE TABLE OVERWRITE route TYPE NORMAL SCHEMAFULL
	PERMISSIONS
		FOR select FULL,
        FOR create, update, delete WHERE fn::user::has_permission($auth, 'studio.route');
DEFINE FIELD OVERWRITE id ON TABLE route TYPE string;
DEFINE FIELD OVERWRITE name ON TABLE route TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE timetable ON TABLE route TYPE record<timetable> REFERENCE ON DELETE CASCADE;
DEFINE FIELD OVERWRITE designations ON TABLE route TYPE array<object> DEFAULT [];
DEFINE FIELD OVERWRITE designations[*].type ON TABLE route TYPE record<type>;
DEFINE FIELD OVERWRITE designations[*].number ON TABLE route TYPE string;
DEFINE FIELD OVERWRITE operator ON TABLE route TYPE option<record<operator>>;

-----------
-- line --
-----------

DEFINE TABLE OVERWRITE line SCHEMAFULL
	PERMISSIONS
		FOR select FULL,
        FOR create, update, delete WHERE fn::user::has_permission($auth, 'studio.line');
DEFINE FIELD OVERWRITE id ON TABLE line TYPE string;
DEFINE FIELD OVERWRITE route ON TABLE line TYPE record<route> REFERENCE ON DELETE CASCADE;

DEFINE TABLE OVERWRITE connects SCHEMAFULL TYPE RELATION
    PERMISSIONS
        FOR select FULL,
        FOR create, update, delete WHERE fn::user::has_permission($auth, 'studio.line');
DEFINE FIELD OVERWRITE id ON TABLE connects TYPE string;
DEFINE FIELD OVERWRITE in ON TABLE connects TYPE record<line>;
DEFINE FIELD OVERWRITE out ON TABLE connects TYPE record<stop>;
DEFINE FIELD OVERWRITE arrival ON TABLE connects TYPE object;
DEFINE FIELD OVERWRITE arrival.time ON TABLE connects TYPE datetime;
DEFINE FIELD OVERWRITE arrival.platform ON TABLE connects TYPE string;
DEFINE FIELD OVERWRITE departure ON TABLE connects TYPE object;
DEFINE FIELD OVERWRITE departure.time ON TABLE connects TYPE datetime;
DEFINE FIELD OVERWRITE departure.platform ON TABLE connects TYPE string;

DEFINE FUNCTION OVERWRITE fn::line::board($stop: record<stop>) {
    RETURN SELECT VALUE (
        SELECT id, arrival, departure, in.{id, route.{id, name, designations.{number, type.*}}} AS line,
        (SELECT VALUE out.{name, id} FROM (SELECT * FROM <-line->connects ORDER BY departure.time)) AS stops
        FROM <-connects
    ) AS lines FROM ONLY $stop;
};

DEFINE FUNCTION OVERWRITE fn::line::stops($line: record<line>) {
    RETURN 
        SELECT id, route.{id, name, designations.{number, type.*}},
        (SELECT id, arrival, departure, departure.time, out.id AS id, out.name AS name FROM ->connects ORDER BY departure.time) AS stops
        FROM ONLY $line;
};

-------------
-- journey --
-------------

DEFINE TABLE OVERWRITE journey SCHEMAFULL
	PERMISSIONS
		FOR select FULL,
        FOR create, update, delete WHERE fn::user::has_permission($auth, 'studio.journey');
DEFINE FIELD OVERWRITE id ON TABLE journey TYPE string;
DEFINE FIELD OVERWRITE line ON TABLE journey TYPE record<line> REFERENCE ON DELETE CASCADE;
DEFINE FIELD OVERWRITE canceled ON TABLE journey TYPE bool DEFAULT false;

DEFINE TABLE OVERWRITE visits SCHEMAFULL TYPE RELATION
    PERMISSIONS
        FOR select FULL,
        FOR create, update, delete WHERE fn::user::has_permission($auth, 'studio.journey');
DEFINE FIELD OVERWRITE id ON TABLE visits TYPE string;
DEFINE FIELD OVERWRITE in ON TABLE visits TYPE record<journey>;
DEFINE FIELD OVERWRITE out ON TABLE visits TYPE record<stop>;
DEFINE FIELD OVERWRITE canceled ON TABLE visits TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE sceduled ON TABLE visits TYPE record<connects>;
DEFINE FIELD OVERWRITE realtime ON TABLE visits TYPE object;
DEFINE FIELD OVERWRITE realtime.arrival ON TABLE visits TYPE object;
DEFINE FIELD OVERWRITE realtime.arrival.time ON TABLE visits TYPE datetime;
DEFINE FIELD OVERWRITE realtime.arrival.platform ON TABLE visits TYPE string;
DEFINE FIELD OVERWRITE realtime.departure ON TABLE visits TYPE object;
DEFINE FIELD OVERWRITE realtime.departure.time ON TABLE visits TYPE datetime;
DEFINE FIELD OVERWRITE realtime.departure.platform ON TABLE visits TYPE string;

DEFINE FUNCTION OVERWRITE fn::journey::stops($journey: record<journey>) {
    RETURN 
        SELECT id, canceled, line.id, line.route.{id, name, designations.{number, type.*}},
        (SELECT id, canceled, realtime, sceduled.arrival, sceduled.departure, sceduled.departure.time, out.id AS id, out.name AS name FROM ->visits ORDER BY sceduled.departure.time) AS stops
        FROM ONLY $journey;
};

-----------------
-- information --
-----------------

DEFINE TABLE OVERWRITE information SCHEMAFULL
    PERMISSIONS
        FOR select FULL,
        FOR create, update, delete WHERE fn::user::has_permission($auth, 'studio.information');

DEFINE FIELD OVERWRITE id ON TABLE information TYPE string;
DEFINE FIELD OVERWRITE name ON TABLE information TYPE string;
DEFINE FIELD OVERWRITE description ON TABLE information TYPE string;
DEFINE FIELD OVERWRITE type ON TABLE information TYPE 'INFORMATION' | 'WARNING' | 'DISRUPTION' | 'CLEARANCE';
DEFINE FIELD OVERWRITE content ON TABLE information TYPE option<string>;
DEFINE FIELD OVERWRITE entities ON TABLE journey TYPE array<record<stop | timetable | route | line | journey>> DEFAULT [];

----------
-- role --
----------

DEFINE TABLE OVERWRITE role SCHEMAFULL
	PERMISSIONS
		FOR select FULL,
        FOR create, update, delete WHERE fn::user::has_permission($auth, 'auth.role');
DEFINE FIELD OVERWRITE id ON TABLE role TYPE string;
DEFINE FIELD OVERWRITE name ON role TYPE string;
DEFINE FIELD OVERWRITE permissions ON TABLE role TYPE array<string> DEFAULT [];

UPSERT role:admin CONTENT {
    name: 'admin',
    permissions: [
        'studio.stop',
        'studio.type',
        'studio.operator',
        'studio.timetable',
        'studio.route',
        'studio.line',
        'studio.journey',
        'studio.information',
        'auth.role',
        'auth.user',
    ]
};

----------
-- user --
----------

DEFINE TABLE OVERWRITE user SCHEMAFULL
	PERMISSIONS
		FOR select, update WHERE id = $auth.id || fn::user::has_permission($auth, 'auth.user'),
        FOR create, delete WHERE fn::user::has_permission($auth, 'auth.user');
DEFINE FIELD OVERWRITE id ON TABLE user TYPE string;
DEFINE FIELD OVERWRITE name ON TABLE user TYPE string;
DEFINE FIELD OVERWRITE email ON TABLE user TYPE string ASSERT string::is_email($value);
DEFINE FIELD OVERWRITE password ON TABLE user TYPE string VALUE (IF !$value || $value.starts_with('$argon2id$') { $value } ELSE { crypto::argon2::generate($value) })
    PERMISSIONS
        FOR select NONE,
        FOR create, update WHERE fn::user::has_permission($auth, 'auth.user');
DEFINE FIELD OVERWRITE token ON TABLE user TYPE option<string> VALUE (IF !$value || $value.starts_with('$argon2id$') { $value } ELSE { crypto::argon2::generate($value) })
    PERMISSIONS
        FOR select, create, update NONE;
DEFINE FIELD OVERWRITE roles ON TABLE user TYPE set<record<role>>
    PERMISSIONS
        FOR select WHERE id = $auth.id || fn::user::has_permission($auth, 'auth.user'),
        FOR create, update WHERE fn::user::has_permission($auth, 'auth.user');
DEFINE FIELD OVERWRITE permissions ON TABLE user TYPE set<string>
    PERMISSIONS
        FOR select WHERE id = $auth.id || fn::user::has_permission($auth, 'auth.user'),
        FOR create, update WHERE fn::user::has_permission($auth, 'auth.user');
DEFINE FIELD OVERWRITE account ON TABLE user TYPE object DEFAULT {}
    PERMISSIONS
        FOR select WHERE id = $auth.id || fn::user::has_permission($auth, 'auth.user'),
        FOR create, update WHERE fn::user::has_permission($auth, 'auth.user');
DEFINE FIELD OVERWRITE account.enabled ON TABLE user TYPE bool DEFAULT true;
DEFINE FIELD OVERWRITE account.expiry ON TABLE user TYPE option<datetime>;
DEFINE FIELD OVERWRITE credentials ON TABLE user TYPE object DEFAULT {}
    PERMISSIONS 
        FOR select WHERE id = $auth.id || fn::user::has_permission($auth, 'auth.user'),
        FOR create, update WHERE fn::user::has_permission($auth, 'auth.user');
DEFINE FIELD OVERWRITE credentials.change ON TABLE user TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE credentials.expiry ON TABLE user TYPE option<datetime>;

DEFINE INDEX OVERWRITE name ON user FIELDS name UNIQUE;
DEFINE INDEX OVERWRITE email ON user FIELDS email UNIQUE;

DEFINE ACCESS OVERWRITE user ON DATABASE TYPE RECORD
	SIGNIN {
		LET $user = SELECT * FROM ONLY user WHERE name = $username AND crypto::argon2::compare(password, $password);
        IF !$user {
            THROW 'error.user.password.invalid: Your credentials are invalid!';
        } ELSE IF $user.account.enabled == false || (type::is_datetime($user.account.expiry) && $user.account.expiry < time::now()) {
            THROW 'error.user.deactivated: Your account is deactivated!';
        } ELSE IF $user.credentials.change == true || (type::is_datetime($user.credentials.expiry) && $user.credentials.expiry < time::now()) {
            THROW 'error.user.password.change.required: Your password have to be changed!';
        };
        RETURN $user;
    }
	SIGNUP (
		CREATE user CONTENT {
			name: $name,
			email: $email,
			password: crypto::argon2::generate($password),
            roles: [],
            permissions: []
		}
	) DURATION FOR TOKEN 8h, FOR SESSION 8h;

DEFINE TABLE OVERWRITE _password_change_request SCHEMAFULL
	PERMISSIONS
		FOR create FULL;
DEFINE FIELD OVERWRITE id ON TABLE _password_change_request TYPE string;
DEFINE FIELD OVERWRITE username ON TABLE _password_change_request TYPE string DEFAULT (IF !$input.username && $auth { $auth.name });
DEFINE FIELD OVERWRITE old ON TABLE _password_change_request TYPE string;
DEFINE FIELD OVERWRITE new ON TABLE _password_change_request TYPE string;
DEFINE FIELD OVERWRITE repeat ON TABLE _password_change_request TYPE string;
DEFINE FIELD OVERWRITE created ON TABLE _password_change_request TYPE datetime VALUE time::now() READONLY;

DEFINE EVENT OVERWRITE _password_change_request ON TABLE _password_change_request WHEN $event = 'CREATE' THEN {
    LET $user = (SELECT * FROM ONLY user WHERE name = $after.username AND crypto::argon2::compare(password, $after.old));
    IF !$user {
        THROW 'error.user.password.invalid: Your credentials are invalid!';
    } ELSE IF $after.new != $after.repeat {
        THROW 'error.user.password.change.repeat: Your new passwords have to be the same!';
    } ELSE IF $after.old == $after.new {
        THROW 'error.user.password.change.different: Your new password must be different from the old one!';
    } ELSE {
        UPDATE $user.id SET password = $after.new, credentials.change = false, credentials.expiry = NONE;
    };
    DELETE $after.id;
};

DEFINE FUNCTION OVERWRITE fn::user::has_permission($user: record<user>, $permissions: string) {
    RETURN set::includes($user.permissions, $permissions) || set::includes($user.roles.map(|$role| $role.permissions).flatten(), $permissions)
};

INSERT IGNORE INTO user [
    {
        id: user:admin,
        name: 'admin',
        email: 'admin@trainwatch.derzauberer.eu',
        password: 'admin',
        roles: <set>[role:admin],
        permissions: <set>[],
        account: {
			enabled: true,
            expiry: NONE
		},
        credentials: {
			change: false,
            expiry: NONE
		}
    },
    {
        id: user:guest,
        name: 'guest',
        email: 'guest@trainwatch.derzauberer.eu',
        password: 'guest',
        roles: <set>[],
        permissions: <set>[],
        account: {
			enabled: false,
            expiry: NONE
		},
        credentials: {
			change: false,
            expiry: NONE
		}
    }
];