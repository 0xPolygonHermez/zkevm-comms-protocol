var PROTO_PATH = __dirname + '/proto/zk-prover.proto';

const ethers = require("ethers");
const SqlDb = require("./sql-db");
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

const configSql = {
  user: "user",
  host: "host",
  database: "database",
  password: "password",
  port: "port",
}

const testProof = {
  proofA: ["0", "0"],
  proofB: [{ proof: ["0", "0"] }, { proof: ["0", "0"] }],
  proofC: ["0", "0"],
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

async function getInfoDB(sql) {
  //   **Buffer bytes notation**
  // [ 256 bits ] currentStateRoot
  // [ 256 bits ] currentLocalExitRoot
  // [ 256 bits ] newStateRoot
  // [ 256 bits ] newLocalExitRoot
  // [ 160 bits ] sequencerAddress
  // [ 256 bits ] keccak256(l2TxsData # lastGlobalExitRoot)
  // [ 16 bits  ] chainID (sequencerID)
  const publicInputs = {
    currentStateRoot: await sql.getRoot(),
    currentLocalExitRoot: await sql.getRoot(),
    newStateRoot: await sql.getRoot(),
    newLocalExitRoot: await sql.getRoot(),
    sequencerAddress: "0x1111111111111111111111111111111111111111",
    l2TxsDataLastGlobalExitRoot: await sql.getRoot(),
    chainId: "0x1",
  }
  return publicInputs;
}

async function calculateProof(l2Txs, sql) {
  currentState = state.PENDING;
  const numLoops = timeoutProof / 1000;
  const loopTimeout = timeoutProof / numLoops;
  const publicInputs = await getInfoDB(sql);
  publicInputs.l2TxsDataLastGlobalExitRoot = ethers.utils.solidityKeccak256(['bytes', 'bytes32'], [l2Txs.l2Txs, publicInputs.l2TxsDataLastGlobalExitRoot]);
  console.log(publicInputs);
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

async function genProof(call) {
  const sql = new SqlDb(/*configSql*/);
  //await sql.connect();
  call.on('data', async function (l2Txs) {
    if (l2Txs.message == "cancel") {
      if (currentState == state.PENDING) isCancel = true;
      currentState = state.IDLE;
    } else {
      const proof = await calculateProof(l2Txs, sql);
      call.write(proof);
    }
  });
  call.on('end', async function () {
    if (typeof sql !== "undefined") {
      //await sql.disconnect();
    }
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
