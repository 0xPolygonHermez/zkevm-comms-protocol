/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const path = require('path');
const ethers = require('ethers');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { spawn } = require('child_process');
const { timeout } = require('../src/helpers');

describe('Server prover', function () {
    this.timeout(30000);

    let client;
    let processExec;

    before(async () => {
        const SERVER_PATH = path.join(__dirname, '../zk-prover-server.js');
        processExec = spawn('node', [SERVER_PATH, 5000]);
        await timeout(1000);
        const PROTO_PATH = path.join(__dirname, '../proto/zk-prover.proto');

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
    });
    it('Get Status', (done) => {
        client.getStatus(null, (err, response) => {
            expect(response.status).to.be.equal('IDLE');
            expect(response.proof).to.be.null;
            done();
        });
    });
    it('Get proof null', (done) => {
        client.getProof(null, (err, response) => {
            expect(response).to.be.undefined;
            done();
        });
    });
    const batch = {
        l2Txs: Buffer.from('222222', 'hex'),
        message: 'calculate',
        currentStateRoot: Buffer.from('1234123412341234123412341234123412341234123412341234123412341234', 'hex'),
        newStateRoot: Buffer.from('1212121212121212121212121212121212121212121212121212121212121212', 'hex'),
        lastGlobalExitRoot: Buffer.from('1234123412341234123412341234123412341234123412341234123412341234', 'hex'),
        sequencerAddress: '0x1111111111222222222233333333334444444444',
        chainId: 20,
    };
    it('Gen proof', (done) => {
        const call = client.genProof();
        call.on('data', (proof) => {
            const l2TxsDataLastGlobalExitRoot = Buffer.from(ethers.utils.solidityKeccak256(['bytes', 'bytes32'], [batch.l2Txs, batch.lastGlobalExitRoot]).slice(2), 'hex');
            expect(proof.proofA.toString()).to.be.equal(['0', '0'].toString());
            expect(proof.proofB[0].proof.toString()).to.be.equal(['0', '0'].toString());
            expect(proof.proofB[1].proof.toString()).to.be.equal(['0', '0'].toString());
            expect(proof.proofC.toString()).to.be.equal(['0', '0'].toString());
            for (let i = 0; i < batch.currentStateRoot.length; i++) {
                expect(proof.publicInputs.currentStateRoot[i]).to.be.equal(batch.currentStateRoot[i]);
                expect(proof.publicInputs.newStateRoot[i]).to.be.equal(batch.newStateRoot[i]);
                expect(proof.publicInputs.l2TxsDataLastGlobalExitRoot[i]).to.be.equal(l2TxsDataLastGlobalExitRoot[i]);
            }
            expect(proof.publicInputs.currentLocalExitRoot.length).to.be.equal(0);
            expect(proof.publicInputs.newLocalExitRoot.length).to.be.equal(0);
            expect(proof.publicInputs.sequencerAddress).to.be.equal(batch.sequencerAddress);
            expect(proof.publicInputs.chainId.toString()).to.be.equal(batch.chainId.toString());
            call.end();
            done();
        });
        call.write(batch);
    });
    it('Get Status', (done) => {
        client.getStatus(null, (err, response) => {
            const l2TxsDataLastGlobalExitRoot = Buffer.from(ethers.utils.solidityKeccak256(['bytes', 'bytes32'], [batch.l2Txs, batch.lastGlobalExitRoot]).slice(2), 'hex');
            expect(response.status).to.be.equal('FINISHED');
            expect(response.proof.proofA.toString()).to.be.equal(['0', '0'].toString());
            expect(response.proof.proofB[0].proof.toString()).to.be.equal(['0', '0'].toString());
            expect(response.proof.proofB[1].proof.toString()).to.be.equal(['0', '0'].toString());
            expect(response.proof.proofC.toString()).to.be.equal(['0', '0'].toString());
            for (let i = 0; i < batch.currentStateRoot.length; i++) {
                expect(response.proof.publicInputs.currentStateRoot[i]).to.be.equal(batch.currentStateRoot[i]);
                expect(response.proof.publicInputs.newStateRoot[i]).to.be.equal(batch.newStateRoot[i]);
                expect(response.proof.publicInputs.l2TxsDataLastGlobalExitRoot[i]).to.be.equal(l2TxsDataLastGlobalExitRoot[i]);
            }
            expect(response.proof.publicInputs.currentLocalExitRoot.length).to.be.equal(0);
            expect(response.proof.publicInputs.newLocalExitRoot.length).to.be.equal(0);
            expect(response.proof.publicInputs.sequencerAddress).to.be.equal(batch.sequencerAddress);
            expect(response.proof.publicInputs.chainId.toString()).to.be.equal(batch.chainId.toString());
            done();
        });
    });
    const batch2 = {
        l2Txs: Buffer.from('33333333', 'hex'),
        message: 'calculate',
        currentStateRoot: Buffer.from('1234123412341234123412341234123412341234123412341234123412341234', 'hex'),
        newStateRoot: Buffer.from('1212121212121212121212121212121212121212121212121212121212121212', 'hex'),
        lastGlobalExitRoot: Buffer.from('1234123412341234123412341234123412341234123412341234123412341234', 'hex'),
        sequencerAddress: '0x1111111111111111111111111111111111111111',
        chainId: 22,
    };
    it('Gen proof', (done) => {
        const call = client.genProof();
        call.write(batch2);
        call.end();
        done();
    });
    it('Get Status PENDING', (done) => {
        client.getStatus(null, (err, response) => {
            expect(response.status).to.be.equal('PENDING');
            expect(response.proof.proofA.length).to.be.equal(0);
            expect(response.proof.proofB.length).to.be.equal(0);
            expect(response.proof.proofC.length).to.be.equal(0);
            for (let i = 0; i < batch.currentStateRoot.length; i++) {
                expect(response.proof.publicInputs.currentStateRoot[i]).to.be.equal(batch2.currentStateRoot[i]);
            }
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
    after(() => {
        process.kill(processExec.pid);
    });
});
