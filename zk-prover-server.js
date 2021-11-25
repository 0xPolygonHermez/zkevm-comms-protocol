var PROTO_PATH = __dirname + '/zk-prover.proto';

var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
var zkProverProto = grpc.loadPackageDefinition(packageDefinition).zkprover;

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Enum proof states
const state = {
  IDLE: 0,
  ERROR: 1,
  PENDING: 2,
  FINISHED: 3,
};
let currentState = state.IDLE;
let isCancel = false;

let timeoutProof;
if (process.argv[2] == undefined) timeoutProof = 5000;
else timeoutProof = Number(process.argv[2]);

const testProof = {
  proofA: ["1", "2"],
  proofB: [{ proof: ["3", "4"] }, { proof: ["5", "6"] }],
  proofC: ["7", "8"],
  publicInputs: {
    currentStateRoot: "0x1234",
    currentLocalExitRoot: "0x1234",
    newStateRoot: "0x12345",
    newLocalExitRoot: "0x12345",
    sequencerAddress: "0x1111111111111111111111111111111111111111",
    l2Txs: "0x123412341234",
    chainId: "0x1",
  },
};

function getStatus(call, callback) {
  if (currentState == state.FINISHED)
    callback(null, { status: currentState, proof: testProof });
  else
    callback(null, { status: currentState });
}

function getProof(call, callback) {
  if (currentState == state.FINISHED)
    callback(null, testProof);
  else
    callback(null, undefined)
}

async function calculateProof(l2Txs) {
  currentState = state.PENDING;
  const numLoops = timeoutProof / 1000;
  const loopTimeout = timeoutProof / numLoops;
  for (let i = 0; i < numLoops; i++) {
    if (!isCancel) await timeout(loopTimeout);
    else break;
  }
  if (!isCancel) currentState = state.FINISHED;
  else {
    isCancel = false;
  }
  await timeout(timeoutProof);
  return testProof;
}

function genProof(call) {
  call.on('data', async function (l2Txs) {
    if (l2Txs.message == "cancel") {
      if (currentState == state.PENDING) isCancel = true;
      currentState = state.IDLE;
    } else {
      const proof = await calculateProof(l2Txs);
      call.write(proof);
    }
  });
  call.on('end', function () {
    call.end();
  });
}

function cancel(call, callback) {
  if (currentState == state.PENDING) isCancel = true;
  currentState = state.IDLE;
  callback(null, { status: currentState });
}

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function main() {
  var server = new grpc.Server();
  server.addService(zkProverProto.ZKProver.service, {
    getStatus: getStatus,
    getProof: getProof,
    genProof: genProof,
    cancel: cancel,
  });
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
  });
}

main();
