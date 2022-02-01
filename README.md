# Protocol definition
- `proto/zk-prover-proto` contains the service specification
- Following documentation pretends to explain further its behaviour

## Service functionalities
```
rpc GetStatus(NoParams) returns (State) {}
rpc GenProof(stream InputProver) returns (stream Proof) {}
rpc Cancel(NoParams) returns (State) {}
rpc GetProof(NoParams) returns (Proof) {}
```

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
message InputProver {
    string message = 1;
    PublicInputs publicInputs = 2;
    string globalExitRoot = 3;
    repeated string txs = 4;
    map<string, string> keys = 5;
}
```
where:
```
message PublicInputs {
    string oldStateRoot = 1;
    string oldLocalExitRoot = 2;
    string newStateRoot = 3;
    string newLocalExitRoot = 4;
    string sequencerAddr = 5;
    string batchHashData = 6;
    uint32 chainId = 7;
    uint32 batchNum = 8;
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
    PublicInputsExtended publicInputsExtended = 4;
}
```

where:
```
message PublicInputsExtended {
    PublicInputs publicInputs = 2;
    string inputHash = 5;
}

message ProofX {
    repeated string proof = 1;
}
```

This channel will be open until the client decides to close it. In this way, the client can continue requesting proofs by sending the message `InputProver`.

### Cancel
If the previous channel is closed and the server has computed a proof, the client can cancel it with this call.

The client does not need to enter data to make this call.
The prover returns the status to confirm that the proof calculation is canceled.

### GetProof
Function to get the last calculated proof.

The client does not need to enter data to make this call.
If the status is `FINISHED`, the last proof is returned.