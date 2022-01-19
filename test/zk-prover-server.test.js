/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { spawn } = require('child_process');
const lodash = require('lodash');

const { timeout } = require('../src/helpers');
const helpers = require('./helpers');
const expectedInput = require('./test-vectors/input_2.json');

describe('Server zk-mock-prover', function () {
    this.timeout(30000);

    const ENV_PATH = path.join(__dirname, '../.env');
    const SERVER_PATH = path.join(__dirname, '../zk-prover-server.js');
    const PROTO_PATH = path.join(__dirname, '../proto/zk-prover.proto');

    let client;
    let processExec;
    let oldEnvFileStr;
    let inputProver;

    const expectedResProof = {
        proofA: ['0', '0'],
        proofB: [{ proof: ['0', '0'] }, { proof: ['0', '0'] }],
        proofC: ['0', '0'],
        publicInputsExtended: {
        },
    };

    before(async () => {
        // setup environment file
        const keys = ['POSTGRES_USER', 'POSTGRES_HOST', 'POSTGRES_DB',
            'POSTGRES_PASSWORD', 'POSTGRES_PORT', 'PROOF_TIME'];
        const values = ['hermez', 'localhost', 'polygon-hermez', 'polygon', '5432', '5000'];

        oldEnvFileStr = await helpers.setEnvFile(ENV_PATH, keys, values);

        processExec = spawn('node', [SERVER_PATH]);
        processExec.stdout.pipe(process.stdout);
        await timeout(1000);

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
        client = new zkProverProto.ZKProver(
            target,
            grpc.credentials.createInsecure(),
        );

        // delete "db" property from it will be get from sql
        inputProver = { ...expectedInput };
        delete inputProver.db;
    });

    it('Get Status: IDLE', (done) => {
        client.getStatus(null, (err, response) => {
            expect(response.status).to.be.equal('IDLE');
            expect(response.proof).to.be.null;
            done();
        });
    });

    it('Get proof: no proof computed', (done) => {
        client.getProof(null, (err, response) => {
            expect(response).to.be.undefined;
            done();
        });
    });

    it('Gen proof: verify response', (done) => {
        const inputProverCalculate = {};
        inputProverCalculate.txs = inputProver.txs;
        inputProverCalculate.globalExitRoot = inputProver.globalExitRoot;
        inputProverCalculate.keys = inputProver.keys;
        inputProverCalculate.publicInputs = { ...inputProver };
        inputProverCalculate.message = 'calculate';

        const call = client.genProof();
        call.on('data', (res) => {
            // check mock proof
            expect(lodash.isEqual(res.proof.proofA, expectedResProof.proofA)).to.be.equal(true);
            expect(lodash.isEqual(res.proof.proofB, expectedResProof.proofB)).to.be.equal(true);
            expect(lodash.isEqual(res.proof.proofC, expectedResProof.proofC)).to.be.equal(true);

            // check public inputs
            const { publicInputs, inputHash } = res.proof.publicInputsExtended;
            expect(publicInputs.oldStateRoot).to.be.equal(expectedInput.oldStateRoot);
            expect(publicInputs.oldLocalExitRoot).to.be.equal(expectedInput.oldLocalExitRoot);
            expect(publicInputs.newStateRoot).to.be.equal(expectedInput.newStateRoot);
            expect(publicInputs.newlocalExitRoot).to.be.equal(expectedInput.newlocalExitRoot);
            expect(publicInputs.sequencerAddr).to.be.equal(expectedInput.sequencerAddr);
            expect(publicInputs.batchHashData).to.be.equal(expectedInput.batchHashData);
            expect(publicInputs.chainId).to.be.equal(expectedInput.chainId);
            expect(publicInputs.batchNum).to.be.equal(expectedInput.batchNum);
            expect(inputHash).to.be.equal(expectedInput.inputHash);

            call.end();
            done();
        });
        call.write(inputProverCalculate);
    });

    it('Get Status: FINISHED', (done) => {
        client.getStatus(null, (err, response) => {
            // check proof
            expect(response.status).to.be.equal('FINISHED');
            expect(response.proof.proofA.toString()).to.be.equal(['0', '0'].toString());
            expect(response.proof.proofB[0].proof.toString()).to.be.equal(['0', '0'].toString());
            expect(response.proof.proofB[1].proof.toString()).to.be.equal(['0', '0'].toString());
            expect(response.proof.proofC.toString()).to.be.equal(['0', '0'].toString());

            // check public inputs
            const { publicInputs, inputHash } = response.proof.publicInputsExtended;
            expect(publicInputs.oldStateRoot).to.be.equal(expectedInput.oldStateRoot);
            expect(publicInputs.oldLocalExitRoot).to.be.equal(expectedInput.oldLocalExitRoot);
            expect(publicInputs.newStateRoot).to.be.equal(expectedInput.newStateRoot);
            expect(publicInputs.newlocalExitRoot).to.be.equal(expectedInput.newlocalExitRoot);
            expect(publicInputs.sequencerAddr).to.be.equal(expectedInput.sequencerAddr);
            expect(publicInputs.batchHashData).to.be.equal(expectedInput.batchHashData);
            expect(publicInputs.chainId).to.be.equal(expectedInput.chainId);
            expect(publicInputs.batchNum).to.be.equal(expectedInput.batchNum);
            expect(inputHash).to.be.equal(expectedInput.inputHash);
            done();
        });
    });

    it('Gen proof: no verifying', (done) => {
        const inputProverCalculate = {};
        inputProverCalculate.txs = inputProver.txs;
        inputProverCalculate.globalExitRoot = inputProver.globalExitRoot;
        inputProverCalculate.keys = inputProver.keys;
        inputProverCalculate.publicInputs = { ...inputProver };
        inputProverCalculate.publicInputs.batchNum = 7;
        inputProverCalculate.message = 'calculate';

        const call = client.genProof();
        call.write(inputProverCalculate);
        call.end();
        done();
    });

    it('Get Status: PENDING', (done) => {
        client.getStatus(null, (err, response) => {
            expect(response.status).to.be.equal('PENDING');
            // check batch has been updated
            expect(response.proof.publicInputsExtended.publicInputs.batchNum).to.be.equal(7);
            done();
        });
    });

    it('Cancel', (done) => {
        client.cancel(null, (err, response) => {
            expect(response.status).to.be.equal('IDLE');
            done();
        });
    });

    it('Get Status IDLE', (done) => {
        client.getStatus(null, (err, response) => {
            expect(response.status).to.be.equal('IDLE');
            expect(response.proof).to.be.null;
            done();
        });
    });

    after(async () => {
        process.kill(processExec.pid);

        if (typeof oldEnvFileStr !== 'undefined') {
            await fs.writeFileSync(ENV_PATH, oldEnvFileStr);
        } else {
            await fs.unlinkSync(ENV_PATH);
        }
    });
});
