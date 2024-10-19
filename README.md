# PassengerInformationSystem

## Development

Donwnload SurrealDB: https://surrealdb.com/install

Start SurrealDB:
```bash
surreal start --log info --user admin --pass admin --deny-all --allow-scripting --allow-funcs --bind 0.0.0.0:8080 surrealkv:data
```

Or Create Docker Container:
```bash
docker run always -p 8080:8080 -v surrealdb:/data surrealdb start --log info --user admin --pass admin --deny-all --allow-scripting --allow-funcs --bind 0.0.0.0:8080 surrealkv:data
```

Import the scripts from the surrealdb folder with the [Surreal Cli](https://surrealdb.com/docs/surrealdb/cli/import) or with [Curl](https://surrealdb.com/docs/surrealdb/integration/http#ml-import)