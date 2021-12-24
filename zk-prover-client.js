/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const PROTO_PATH = `${__dirname}/proto/zk-prover.proto`;

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

require('dotenv').config();
const expectedInput = require('./test/test-vectors/input_2.json');

const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    },
);
const zkProverProto = grpc.loadPackageDefinition(packageDefinition).zkprover;
const target = 'localhost:50051';
const client = new zkProverProto.ZKProver(
    target,
    grpc.credentials.createInsecure(),
);

let timeoutGenProof;
if (process.env.INPUT_TIME === undefined) timeoutGenProof = 10000;
else timeoutGenProof = Number(process.env.INPUT_TIME);

// delete "db" property from it will be get from sql
const inputProver = { ...expectedInput };
delete inputProver.db;

function getStatus(call, callback) {
    client.getStatus(null, (err, response) => {
        console.log('Status:', response.status);
        console.log('Proof:', response.proof);
    });
}

function getProof(call, callback) {
    client.getProof(null, (err, response) => {
        console.log('Proof:', response);
    });
}

function runGenOneProof(callback) {
    const call = client.genProof();
    call.on('data', (proof) => {
        console.log(proof);
        call.end();
    });
    call.on('end', callback);
    const inputProverCalculate = {};
    inputProverCalculate.txs = inputProver.txs;
    inputProverCalculate.globalExitRoot = inputProver.globalExitRoot;
    inputProverCalculate.keys = inputProver.keys;
    inputProverCalculate.publicInputs = { ...inputProver };
    inputProverCalculate.message = 'calculate';
    call.write(inputProverCalculate);
}

function runGenProofs(callback) {
    const call = client.genProof();
    call.on('data', (proof) => {
        console.log(proof);
    });
    call.on('end', callback);
    const inputProverCalculate = {};
    inputProverCalculate.txs = inputProver.txs;
    inputProverCalculate.globalExitRoot = inputProver.globalExitRoot;
    inputProverCalculate.keys = inputProver.keys;
    inputProverCalculate.publicInputs = { ...inputProver };
    inputProverCalculate.message = 'calculate';
    call.write(inputProverCalculate);
    setInterval(() => {
        call.write(inputProverCalculate);
    }, timeoutGenProof);
}

function cancel(call, callback) {
    client.cancel(null, (err, response) => {
        console.log('Status:', response.status);
    });
}
function mockNode() {
    const command = process.argv[2];
    if (command === 'genproofs') {
        runGenProofs((err, result) => {
        });
    } else if (command === 'genproof') {
        runGenOneProof((err, result) => {
        });
    } else if (command === 'status') {
        getStatus((err, result) => {
        });
    } else if (command === 'cancel') {
        cancel((err, result) => {
        });
    } else {
        console.log('Command error');
    }
}

mockNode();

exports.getStatus = getStatus;
exports.getProof = getProof;
exports.runGenOneProof = runGenOneProof;
exports.runGenProofs = runGenProofs;
exports.cancel = cancel;
