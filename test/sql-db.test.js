const fs = require('fs');
const { expect } = require('chai');
const lodash = require('lodash');

const { getHashTableFromSql } = require('../src/utils-sql');
const SqlDb = require('../src/sql-db');
const expectedInput = require('./test-vectors/input_2.json');

describe('SQL Db', () => {
    const config = {
        user: 'hermez',
        host: 'localhost',
        database: 'polygon-hermez',
        password: 'polygon',
        port: 5432,
    };

    let client;

    after(async () => {
        await client.disconnect();
    });

    it('connect', async () => {
        client = new SqlDb(config);

        expect(client.connected).to.be.equal(false);
        await client.connect();
        expect(client.connected).to.be.equal(true);
    });

    it('get merkle tree hash table', async () => {
        const root = '090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9';
        const arity = 4;

        const hashTable = await getHashTableFromSql(client, root, arity);
        expect(lodash.isEqual(hashTable, expectedInput.db)).to.be.equal(true);
    });
});
