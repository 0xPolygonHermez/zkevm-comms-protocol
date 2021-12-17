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
This information is required to connect to database and setup the the time to compute the proof

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

- In order to run the image
```
docker run -p 50085:50085 zk-mock-prover:latest
```