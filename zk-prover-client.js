
var PROTO_PATH = __dirname + '/zk-prover.proto';

var async = require('async');
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
const target = 'localhost:50051';
var client = new zkProverProto.ZKProver(target,
  grpc.credentials.createInsecure());

function getStatus(call, callback) {
  client.getStatus(null, function (err, response) {
    console.log("Status:", response.status);
    if (response.status == "FINISHED")
      console.log("Proof:", response.proof);
  });
}

function getProof(call, callback) {
  client.getProof(null, function (err, response) {
    console.log("Proof:", response);
  });
}

function runGenProof(callback) {
  var call = client.genProof();
  call.on('data', function (proof) {
    console.log("CLIENT");
    console.log(proof);
    call.end();
  });
  call.on('end', callback);
  const l2Txs = { l2Txs: "0x222222", message: "calculate" };
  call.write(l2Txs);
}

function cancel(call, callback) {
  client.cancel(null, function (err, response) {
    console.log("Status:", response.status);
  });
}

/**
 * Run all of the demos in order
 */
function main() {
  // async.series([
  //   getStatus,
  //   getProof,
  //   runGenProof,
  //   cancel
  // ]);
  async.series([
    runGenProof
  ]);
}

if (require.main === module) {
  main();
}

exports.getStatus = getStatus;
exports.getProof = getProof;
exports.runGenProof = runGenProof;
exports.cancel = cancel;
