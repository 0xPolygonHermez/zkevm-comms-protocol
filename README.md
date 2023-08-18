# Protocol definition
- `proto/zkprover/v1/zk_prover.proto` contains the service specification
- Following documentation pretends to explain further its behaviour

## Service functionalities
```
/**
 * Define all methods implementes by the gRPC
 * GetStatus: get server report about its current state (non-blocking call)
 * GenProof: ask prover to start proof generation. If prover is biusy, request is queued (non-blocking call)
 * Cancel: ask prover to cancel specific proof (non-blocking call)
 * GetProof: retrieve proof information given a timeout (blocking call)
 * Execute: execute state-transition and gets a report about the starte change (blocking call)
 */
service ZKProverService {
    rpc GetStatus(GetStatusRequest) returns (GetStatusResponse) {}
    rpc GenProof(GenProofRequest) returns (GenProofResponse) {}
    rpc Cancel(CancelRequest) returns (CancelResponse) {}
    rpc GetProof(stream GetProofRequest) returns (stream GetProofResponse) {}
    rpc Execute(stream ExecuteRequest) returns (stream ExecuteResponse) {}
}
```

### GetStatus
#### GetStatusRequest
```
/**
 * @dev GetStatusRequest
 */
message GetStatusRequest {}
```

#### GetStatusResponse
```
/**
 * @dev Response GetStatus
 * @param {state} - server state
 * - BOOTING: being ready to compute proofs
 * - COMPUTING: busy computing a proof
 * - IDLE: waiting for a proof to compute
 * - HALT: stop
 * @param {last_computed_request_id} - last proof identifier that has been computed
 * @param {last_computed_end_time} - last proof timestamp when it was finished
 * @param {current_computing_request_id} - current proof identifier that ius being computed
 * @param {current_computing_start_time} - current proof timestamp when it was started
 * @param {version_proto} - .proto verion
 * @param {version_server} - server version
 * @param {pending_request_queue_ids} - list of pending proof identifier that are in the queue
 */
message GetStatusResponse {
    enum StatusProver {
        STATUS_PROVER_UNSPECIFIED = 0;
        STATUS_PROVER_BOOTING = 1;
        STATUS_PROVER_COMPUTING = 2;
        STATUS_PROVER_IDLE = 3;
        STATUS_PROVER_HALT = 4;
    }
    StatusProver state = 1;
    string last_computed_request_id = 2;
    uint64 last_computed_end_time = 3;
    string current_computing_request_id = 4;
    uint64 current_computing_start_time = 5;
    string version_proto = 6;
    string version_server = 7;
    repeated string pending_request_queue_ids = 8;
}
```

### GenProof
#### GenProofRequest
```
/**
 * @dev GenProofRequest
 * @param {input} - input prover
 */
message GenProofRequest {
    InputProver input = 1;
}
```

#### GenProofResponse
```
/**
 * @dev Response GenProof
 * @param {id} - proof identifier
 * @param {result} - response result
 *  - OK: succesfull response
 *  - ERROR: request is not correct
 *  - INTERNAL_ERROR: server error when delivering the response
 */
message GenProofResponse {
    enum ResultGenProof {
        RESULT_GEN_PROOF_UNSPECIFIED = 0;
        RESULT_GEN_PROOF_OK = 1;
        RESULT_GEN_PROOF_ERROR = 2;
        RESULT_GEN_PROOF_INTERNAL_ERROR = 3;
    }
    string id = 1;
    ResultGenProof result = 2;
}
```

### Cancel
#### CancelRequest
```
/**
 * @dev CancelRequest
 * @param {id} - proof identifier
 */
 message CancelRequest {
    string id = 1;
}
```

#### CancelResponse
```
/**
 * @dev CancelResponse
 * @param {result} - request result
 *  - OK: proof has been cancelled
 *  - ERROR: proof has not been cancelled
 */
message CancelResponse {
    enum ResultCancel {
        RESULT_CANCEL_UNSPECIFIED = 0;
        RESULT_CANCEL_OK = 1;
        RESULT_CANCEL_ERROR = 2;
    }
    ResultCancel result = 1;
}
```

### GetProof
#### GetProofRequest
```
/**
 * @dev Request GetProof
 * @param {id} - proof identifier
 * @param {timeout} - time to wait until the service responds
 */
message GetProofRequest {
    string id = 1;
    uint64 timeout = 2;
}
```

#### GetProofResponse
```
/**
 * @dev GetProofResponse
 * @param {id} - proof identifier
 * @param {proof} - groth16 proof
 * @param {public} - public circuit inputs
 * @param {result} - response result
 *  - COMPLETED_OK: proof has been computed successfully and it is valid
 *  - ERROR: request error
 *  - COMPLETED_ERROR: proof has been computed successfully and it is not valid
 *  - PENDING: proof is being computed
 *  - INTERNAL_ERROR: server error during proof computation
 *  - CANCEL: proof has been cancelled
 * @param {result_string} - extends result information
 */
message GetProofResponse {
    enum ResultGetProof {
        RESULT_GET_PROOF_UNSPECIFIED = 0;
        RESULT_GET_PROOF_COMPLETED_OK = 1;
        RESULT_GET_PROOF_ERROR = 2;
        RESULT_GET_PROOF_COMPLETED_ERROR = 3;
        RESULT_GET_PROOF_PENDING = 4;
        RESULT_GET_PROOF_INTERNAL_ERROR = 5;
        RESULT_GET_PROOF_CANCEL = 6;
    }
    string id = 1;
    Proof proof = 2;
    PublicInputsExtended public = 3;
    ResultGetProof result = 4;
    string result_string = 5;
}
```

### Execute
#### ExecuteRequest
```
/**
 * @dev ExecuteRequest
 * @param {input} - input prover
 */
 message ExecuteRequest {
    InputProver input = 1;
}
```

#### ExecuteResponse
```
/**
 * @dev ExecuteResponse
 * @param {result} - response result
 *  - COMPLETED_OK: proof has been computed successfully and it is valid
 *  - ERROR: request error
 *  - COMPLETED_ERROR: proof has been computed successfully and it is not valid
 *  - PENDING: proof is being computed
 *  - INTERNAL_ERROR: server error during proof computation
 *  - CANCEL: proof has been cancelled
 * @param {diff_keys_values} - modified keys-values in the smt
 * @param {new_state_root} - smt new state root
 * @param {counters} - group all necesarry circuit counters
 * @param {receipts} - ethereum receipts
 * @param {logs} - ethereum logs
 */
message ExecuteResponse {
    enum ResultExecute {
        RESULT_EXECUTE_UNSPECIFIED = 0;
        RESULT_EXECUTE_COMPLETED_OK = 1;
        RESULT_EXECUTE_ERROR = 2;
        RESULT_EXECUTE_COMPLETED_ERR = 3;
        RESULT_EXECUTE_INTERNAL_ERROR = 4;
        RESULT_EXECUTE_CANCEL = 5;
    }
    ResultExecute result = 1;
    map<string, string> diff_keys_values = 2;
    string new_state_root = 3;
    ZkCounters counters = 4;
    repeated string receipts = 5;
    repeated string logs = 6;
}
```

## License

### Copyright
Polygon `zkevm-comms-protocol` was developed by Polygon. While we plan to adopt an open source license, we haven’t selected one yet, so all rights are reserved for the time being. Please reach out to us if you have thoughts on licensing.   

### Disclaimer
This code has not yet been audited, and should not be used in any production systems.
