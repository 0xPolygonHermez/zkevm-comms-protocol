/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const PROTO_PATH = `${__dirname}/proto/zk-prover.proto`;

const async = require('async');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

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

function getStatus(call, callback) {
    client.getStatus(null, (err, response) => {
        console.log(response);
        console.log('Status:', response.status);
        if (response.status === 'FINISHED') {
            console.log('Proof:', response.proof);
        }
    });
}

function getProof(call, callback) {
    client.getProof(null, (err, response) => {
        console.log('Proof:', response);
    });
}

function runGenProof(callback) {
    console.log(client);
    const call = client.genProof();
    call.on('data', (proof) => {
        console.log('CLIENT');
        console.log(proof);
        call.end();
    });
    call.on('end', callback);
    const l2Txs = {
        l2Txs: '0x222222',
        message: 'calculate',
        currentStateRoot: '0x1234123412341234123412341234123412341234123412341234123412341234',
        newStateRoot: '0x1212121212121212121212121212121212121212121212121212121212121212',
        lastGlobalExitRoot: '0x1234123412341234123412341234123412341234123412341234123412341234',
        sequencerAddress: '0x1111111111222222222233333333334444444444',
        chainId: '0x1',
    };
    call.write(l2Txs);
}

function cancel(call, callback) {
    console.log(client);
    client.cancel(null, (err, response) => {
        console.log('Status:', response.status);
    });
}

exports.getStatus = getStatus;
exports.getProof = getProof;
exports.runGenProof = runGenProof;
exports.cancel = cancel;
