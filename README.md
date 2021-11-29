# zk-mock-prover
Emulate the real zk-prover interface and functionality

## Files
- `zk-prover.proto` --> This file defines the `ZKProver` service
- `zk-prover-server.js` --> This file defines the server
- `zk-prover-client.js` (example) --> This file is an example of a client
- `sql-db.js` --> This file defines the interaction with DB

## Server definition

The file begins by defining the functions of the service:
```
rpc GetStatus(NoParams) returns (State) {}
rpc GenProof(stream L2Txs) returns (stream Proof) {}
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
message L2Txs {
    string message = 1;
    string l2Txs = 2;
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
    string currentStateRoot = 1;
    string currentLocalExitRoot = 2;
    string newStateRoot = 3;
    string newLocalExitRoot = 4;
    string sequencerAddress = 5;
    string l2TxsLastGlobalExitRoot = 6;
    string chainId = 7;
}

message ProofX {
    repeated string proof = 1;
}
```

This channel will be open until the client decides to close it. In this way, the client can continue requesting proofs by sending the message `L2Txs`.

### Cancel
If the previous channel is closed and the server has calculated a test, the client can cancel it with this call.

The client does not need to enter data to make this call.
The prover returns the status to confirm that the proof calculation is canceled.

### GetProof
Function to get the last calculated proof.

The client does not need to enter data to make this call.
If the status is `FINISHED`, the last proof is returned.