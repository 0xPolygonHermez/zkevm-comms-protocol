const PROTO_PATH = `${__dirname}/proto/zk-prover.proto`;

const winston = require('winston');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const ethers = require('ethers');

const SqlDb = require('./src/sql-db');
const { timeout } = require('./src/helpers');
const { getHashTableFromSql } = require('./src/utils-sql');
const utilsContracts = require('./src/contract-utils');

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

// configure logger
const options = {
    console: {
        level: 'verbose',
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
        ),
    },
};

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(options.console),
    ],
});

// Enum proof states
const state = {
    IDLE: 0,
    ERROR: 1,
    PENDING: 2,
    FINISHED: 3,
};

const ARITY = 4;

let currentState = state.IDLE;
let currentInputProver = {};
let isCancel = false;
let iSql;

require('dotenv').config();
// eslint-disable-next-line no-unused-vars
const configSql = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
};

let timeoutProof;
if (process.env.PROOF_TIME === undefined) timeoutProof = 5000;
else timeoutProof = Number(process.env.PROOF_TIME);

const testProof = {
    proofA: ['0', '0'],
    proofB: [{ proof: ['0', '0'] }, { proof: ['0', '0'] }],
    proofC: ['0', '0'],
    publicInputsExtended: {
    },
};

function getPublicInputs(inputProver) {
    const { publicInputs, txs, globalExitRoot } = inputProver;
    const batchL2Data = ethers.utils.RLP.encode(txs);
    const batcHashData = utilsContracts.calculateBatchHashData(batchL2Data, globalExitRoot);
    publicInputs.inputHash = utilsContracts.calculateCircuitInput(
        publicInputs.oldStateRoot,
        publicInputs.oldLocalExitRoot,
        publicInputs.newStateRoot,
        publicInputs.newLocalExitRoot,
        publicInputs.sequencerAddr,
        batcHashData,
        publicInputs.chainId,
        publicInputs.batchNum,
    );
    return publicInputs;
}

function getStatus(call, callback) {
    logger.info('Get status');
    if (currentState === state.FINISHED) {
        callback(null, { status: currentState, proof: testProof });
    } else if (currentState === state.PENDING) {
        const publicInputs = getPublicInputs(currentInputProver);
        const proof = {};
        proof.publicInputsExtended = {};
        proof.publicInputsExtended.publicInputs = publicInputs;
        proof.publicInputsExtended.inputHash = publicInputs.inputHash;
        callback(null, { status: currentState, proof });
    } else { callback(null, { status: currentState }); }
}

function getProof(call, callback) {
    logger.info('Get proof');
    if (currentState === state.FINISHED) {
        callback(null, testProof);
    } else {
        callback(null, undefined);
    }
}

async function getInfoDB(inputProver) {
    const publicInputs = getPublicInputs(inputProver);
    // eslint-disable-next-line no-unused-vars
    const hashTable = await getHashTableFromSql(iSql, publicInputs.oldStateRoot, ARITY);
    return { publicInputs, hashTable };
}

async function calculateProof(inputProver) {
    currentState = state.PENDING;
    currentInputProver = inputProver;
    const numLoops = timeoutProof / 1000;
    const loopTimeout = timeoutProof / numLoops;
    // eslint-disable-next-line no-unused-vars
    const { publicInputs, hashTable } = await getInfoDB(inputProver, iSql);

    for (let i = 0; i < numLoops; i++) {
        // eslint-disable-next-line no-await-in-loop
        if (!isCancel) await timeout(loopTimeout);
        else break;
    }

    let resProof;

    if (!isCancel) {
        currentState = state.FINISHED;
        testProof.publicInputsExtended.publicInputs = publicInputs;
        testProof.publicInputsExtended.inputHash = publicInputs.inputHash;
        resProof = testProof;
    } else {
        isCancel = false;
        resProof = {};
    }
    return resProof;
}

async function genProof(call) {
    call.on('data', async (inputProver) => {
        if (inputProver.message === 'cancel') {
            logger.info('Cancel proof');
            if (currentState === state.PENDING) isCancel = true;
            currentState = state.IDLE;
            currentInputProver = {};
        } else if (currentState === state.PENDING) {
            logger.info('Proof is being generated...');
            call.write({ status: currentState, proof: {} });
        } else {
            logger.info('Generate proof');
            const proof = await calculateProof(inputProver);
            call.write({ status: currentState, proof });
        }
    });
    call.on('end', async () => {
        call.end();
    });
}

function cancel(call, callback) {
    if (currentState === state.PENDING) isCancel = true;
    currentState = state.IDLE;
    logger.info('Cancel proof');
    currentInputProver = {};
    callback(null, { status: currentState });
}

/**
 * Starts an RPC server that receives requests for the ZKProver service at the
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
    server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), async () => {
        iSql = new SqlDb(configSql);
        await iSql.connect();
        server.start();
        logger.info(`Connect ${configSql.database} DB on ${configSql.host}:${configSql.port}`);
        logger.info('zk-mock-prover running on port 50051\n');
    });
}

main();
