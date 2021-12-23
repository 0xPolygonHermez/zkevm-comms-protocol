# zk-mock-prover
Emulate the real zk-prover interface and functionality

## Files
- `proto/zk-prover.proto` --> This file defines the `ZKProver` service
- `zk-prover-server.js` --> This file defines the server
- `zk-prover-client.js` (example) --> This file is an example of a client
- `src/sql-db.js` --> This file defines the interaction with DB
- `src/helpers.js` --> Helpers

## Run zk-mock-prover

### configuration
A `.env` file is required. It must contain the following variables:
```
POSTGRES_USER='user'
POSTGRES_HOST='host'
POSTGRES_DB='database'
POSTGRES_PASSWORD='password'
POSTGRES_PORT='port'
PROOF_TIME=5000
```
This information is required to connect to database and setup the time to compute the proof

### Run service
> commands are run from repository root
- Copy the configuration file and set your configuration
```
cp .env.example .env
```

- Command to run the prover from repository
```
npm i
node zk-prover-server.js
```

### Run from docker
> commands are run from repository root
- Copy the configuration file and set your configuration
```
cp .env.example .env
```

- Build docker image
  - the following command will create an image tagged as `zk-mock-prover:latest`
```
npm run build:docker
```

- In order to run the image with custom environment files
```
docker run --rm --name zk-mock-prover -p 50085:50085 -e POSTGRES_USER="user" -e POSTGRES_HOST="localhost" -e POSTGRES_DB="database" -e POSTGRES_PASSWORD="password" -e POSTGRES_PORT="port" -e PROOF_TIME=5000 -d hermeznetwork/zk-mock-prover:latest
```

## Tests
- In order to create a postgresDb to run the test:
```
git clone git@github.com:hermeznetwork/hermez-core.git
cd hermez-core
make start-db
go test ./state --run TestStateTransition
```
- Table fields:
```
CREATE TABLE state.merkletree
(
  hash BYTEA PRIMARY KEY,
  data BYTEA NOT NULL
);
```
- Run tests:
```
npm run test
```