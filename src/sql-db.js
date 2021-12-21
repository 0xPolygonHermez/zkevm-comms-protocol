// eslint-disable-next-line no-unused-vars
const { Client } = require('pg');

const { str2Bytea } = require('./utils-sql');

/**
 * Interface to interact with a SQL databse
 */
class SqlDb {
    /**
     * Creates new client with a given configuration file
     */
    constructor(config) {
        this.config = config;
        this.client = new Client({
            user: this.config.user,
            host: this.config.host,
            database: this.config.database,
            password: this.config.password,
            port: this.config.port,
        });

        this.connected = false;
    }

    /**
     * connect Db
     */
    async connect() {
        await this.client.connect();
        this.connected = true;
    }

    /**
     * finish Db connection
     */
    async disconnect() {
        await this.client.end();
        this.connected = false;
    }

    /**
     * throw error if Db is not connected
     */
    _checkConnected() {
        if (!this.connected) {
            throw new Error('SQL database is not connected');
        }
    }

    /**
     * get merkle tree information
     * @param {String} hash merkle tree root
     * @returns {Object} reverse merkle tree hash table
     */
    async getMerkleTree(hash) {
        this._checkConnected();

        if (typeof hash === 'undefined') {
            const query = `
                SELECT *
                FROM state.merkletree`;

            const res = await this.client.query(query);

            return res.rows;
        }
        const query = `
           SELECT *
           FROM state.merkletree
           WHERE hash = $1`;

        const values = [str2Bytea(hash)];

        const res = await this.client.query(query, values);
        return res.rows[0];
    }
}

module.exports = SqlDb;
