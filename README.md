# zk-mock-prover
Emulate the real zk-prover interface and functionality

## Files
- `proto/zk-prover.proto` --> This file defines the `ZKProver` service
- `zk-prover-server.js` --> This file defines the server
- `zk-prover-client.js` (example) --> This file is an example of a client
- `src/sql-db.js` --> This file defines the interaction with DB
- `src/helpers.js` --> Helpers

## Run server prover

The command to run the prover is the following:
```
node zk-prover-server.js ${timeProof}
```

- `timeProof`: the time it will take for the prover to return the proof (Default: `5000 ms`)

### .env

A `.env` file is required. It must contain the following variables:
```
POSTGRES_USER='user'
POSTGRES_HOST='host'
POSTGRES_DB='database'
POSTGRES_PASSWORD='password'
POSTGRES_PORT='port'
```
This information is required to connect to database.

## Server definition

The file begins by defining the functions of the service:
```
rpc GetStatus(NoParams) returns (State) {}
rpc GenProof(stream Batch) returns (stream Proof) {}
rpc Cancel(NoParams) returns (State) {}
rpc GetProof(NoParams) returns (Proof) {}
```

And then, the messages that use the previous functions are defined.

### GetStatus
Function to know the status of the prover.

The client does not need to enter data to make this call.
The status is returned in the following form:
```
message State {
    enum Status {
        IDLE = 0;
        ERROR = 1;
        PENDING = 2;
        FINISHED = 3;
    }
    Status status = 1;
    Proof proof = 2;
}
```

The status will be one of those defined in the `enum`. Proof is only defined if the status is `FINISHED`.

### GenProof
Function to generate the proofs.

The client must provide the following information to the server when calling the function:
```
message Batch {
    string message = 1;
    bytes currentStateRoot = 2;
    bytes newStateRoot = 3;
    bytes l2Txs = 4;
    bytes lastGlobalExitRoot = 5;
    string sequencerAddress = 6;
    uint64 chainId = 7;
}
```

Where the message can be:
- `"calculate"`: to generate the proof
- `"cancel"`: to cancel the last proof

And the server will respond:
```
message Proof {
    repeated string proofA = 1;
    repeated ProofX proofB = 2;
    repeated string  proofC = 3;
    PublicInputs publicInputs = 4;
}
```

Where:
```
message PublicInputs {
    bytes currentStateRoot = 1;
    bytes currentLocalExitRoot = 2;
    bytes newStateRoot = 3;
    bytes newLocalExitRoot = 4;
    string sequencerAddress = 5;
    bytes l2TxsDataLastGlobalExitRoot = 6;
    uint64 chainId = 7;
}

message ProofX {
    repeated string proof = 1;
}
```

This channel will be open until the client decides to close it. In this way, the client can continue requesting proofs by sending the message `Batch`.

### Cancel
If the previous channel is closed and the server has computed a proof, the client can cancel it with this call.

The client does not need to enter data to make this call.
The prover returns the status to confirm that the proof calculation is canceled.

### GetProof
Function to get the last calculated proof.

The client does not need to enter data to make this call.
If the status is `FINISHED`, the last proof is returned.
