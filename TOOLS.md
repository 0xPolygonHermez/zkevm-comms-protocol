# Tools (v0)
`zk-mock-prver` & `zk-mock-client`

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

## Run zk-mock-client

### configuration
A `.env` file is required. It must contain the following variables:
```
INPUT_TIME=10000
```

Is required previously:
- `postgresDb` (more detailed in the Tests section)
- Run `zk-mock-prover`

### Run client

```
node zk-prover-client.js {command}
```

Where {command}:
- `status`: return status
- `genproof`: generate one proof
- `genproofs`: generate multiple proofs every {INPUT_TIME} ms
- `cancel`: cancel the proof that is being generated

## Tests
- In order to create a postgresDb to run the test:
```
git clone git@github.com:hermeznetwork/hermez-core.git
cd hermez-core
git checkout 02cfd142dee1491ed5f3c3236d32337ca1ae0dcb
make start-db
go test ./state --run TestStateTransition -count=1
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
- The enviroment file:
```
POSTGRES_USER='test_user'
POSTGRES_HOST='host'
POSTGRES_DB='database'
POSTGRES_PASSWORD='test_password'
POSTGRES_PORT='port'
```