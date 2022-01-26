const fs = require('fs');
const input = require('./test-vectors/input-test.json');
const utils = require('../src/contract-utils');

describe('Check input', () => {
    it('compute global-hash & batchHashData', async () => {
        // batch hash data
        const batchL2Data = input.txs.reduce((prev, curr) => prev + curr.slice(2), '0x');
        const batcHashData = utils.calculateBatchHashData(batchL2Data, input.globalExitRoot);

        console.log("Batch hash data: ", batcHashData);

        const inputHash = utils.calculateCircuitInput(
            input.oldStateRoot,
            input.oldLocalExitRoot,
            input.newStateRoot,
            input.newLocalExitRoot,
            input.sequencerAddr,
            batcHashData,
            input.chainId,
            input.batchNum,
        );

        console.log("Input hash: ", inputHash);
    });
});
