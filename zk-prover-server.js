const PROTO_PATH = `${__dirname}/proto/zk-prover.proto`;

const ethers = require('ethers');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const SqlDb = require('./src/sql-db');
const { timeout } = require('./src/helpers');

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

// Enum proof states
const state = {
    IDLE: 0,
    ERROR: 1,
    PENDING: 2,
    FINISHED: 3,
};
let currentState = state.IDLE;
let currentBatch = {};
let isCancel = false;

let timeoutProof;
if (process.argv[2] === undefined) timeoutProof = 5000;
else timeoutProof = Number(process.argv[2]);

// eslint-disable-next-line no-unused-vars
const configSql = {
    user: 'user',
    host: 'host',
    database: 'database',
    password: 'password',
    port: 'port',
};

const testProof = {
    proofA: ['0', '0'],
    proofB: [{ proof: ['0', '0'] }, { proof: ['0', '0'] }],
    proofC: ['0', '0'],
    publicInputs: {
    },
};

function getPublicInputs(batch) {
    //   **Buffer bytes notation**
    // [ 256 bits ] currentStateRoot
    // [ 256 bits ] currentLocalExitRoot
    // [ 256 bits ] newStateRoot
    // [ 256 bits ] newLocalExitRoot
    // [ 160 bits ] sequencerAddress
    // [ 256 bits ] keccak256(l2TxsData # lastGlobalExitRoot)
    // [ 16 bits  ] chainID (sequencerID)
    const publicInputs = {
        currentStateRoot: batch.currentStateRoot,
        currentLocalExitRoot: Buffer.from('0x', 'hex'),
        newStateRoot: batch.newStateRoot,
        newLocalExitRoot: Buffer.from('0x', 'hex'),
        sequencerAddress: batch.sequencerAddress,
        l2TxsDataLastGlobalExitRoot: Buffer.from(ethers.utils.solidityKeccak256(['bytes', 'bytes32'], [batch.l2Txs, batch.lastGlobalExitRoot]).slice(2), 'hex'),
        chainId: batch.chainId,
    };
    return publicInputs;
}

function getStatus(call, callback) {
    if (currentState === state.FINISHED) {
        callback(null, { status: currentState, proof: testProof });
    } else if (currentState === state.PENDING) {
        const proof = {
            publicInputs: getPublicInputs(currentBatch),
        };
        callback(null, { status: currentState, proof });
    } else { callback(null, { status: currentState }); }
}

function getProof(call, callback) {
    if (currentState === state.FINISHED) { callback(null, testProof); } else { callback(null, undefined); }
}

function getInfoDB(batch, sql) {
    const publicInputs = getPublicInputs(batch);
    // eslint-disable-next-line no-unused-vars
    const merkleTree = sql.getMerkleTree();
    return publicInputs;
}

async function calculateProof(batch, sql) {
    currentState = state.PENDING;
    currentBatch = batch;
    const numLoops = timeoutProof / 1000;
    const loopTimeout = timeoutProof / numLoops;
    const publicInputs = getInfoDB(batch, sql);
    for (let i = 0; i < numLoops; i++) {
        // eslint-disable-next-line no-await-in-loop
        if (!isCancel) await timeout(loopTimeout);
        else break;
    }
    if (!isCancel) {
        currentState = state.FINISHED;
    } else {
        isCancel = false;
    }
    await timeout(timeoutProof);
    testProof.publicInputs = publicInputs;
    return testProof;
}

async function genProof(call) {
    const sql = new SqlDb(/* configSql */);
    // await sql.connect();
    call.on('data', async (batch) => {
        if (batch.message === 'cancel') {
            if (currentState === state.PENDING) isCancel = true;
            currentState = state.IDLE;
            currentBatch = {};
        } else if (currentState === state.PENDING) {
            throw new Error('Pending proof');
        } else {
            const proof = await calculateProof(batch, sql);
            call.write(proof);
        }
    });
    call.on('end', async () => {
        if (typeof sql !== 'undefined') {
            // await sql.disconnect();
        }
        call.end();
    });
}

function cancel(call, callback) {
    if (currentState === state.PENDING) isCancel = true;
    currentState = state.IDLE;
    currentBatch = {};
    callback(null, { status: currentState });
}

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function main() {
    const server = new grpc.Server();
    server.addService(zkProverProto.ZKProver.service, {
        getStatus,
        getProof,
        genProof,
        cancel,
    });
    server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
        server.start();
    });
}

main();
