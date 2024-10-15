DEFINE TABLE User SCHEMAFULL
	PERMISSIONS
		FOR select, update, delete WHERE id = $auth.id;

DEFINE FIELD name ON User TYPE string;
DEFINE FIELD email ON User TYPE string ASSERT string::is::email($value);
DEFINE FIELD password ON User TYPE string VALUE crypto::argon2::generate($value);

DEFINE INDEX name ON User FIELDS name UNIQUE;
DEFINE INDEX email ON User FIELDS email UNIQUE;

DEFINE ACCESS User ON DATABASE TYPE RECORD
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
]