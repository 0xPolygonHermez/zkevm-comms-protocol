// eslint-disable-next-line no-unused-vars
const { Client } = require('pg');

/**
 * Interface to interact with a SQL databse
 */
class SqlDb {
    /**
   * Creates new client with a given configuration file
   */
    constructor(config) {
        this.config = config;
        // TODO: uncomment the following lines to declare the client

        // this.client = new Client({
        //   user: this.config.user,
        //   host: this.config.host,
        //   database: this.config.database,
        //   password: this.config.password,
        //   port: this.config.port,
        // });

    // this.connected = false;
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
   * get  merkle tree information
   */
    async getMerkleTree() {
        return '0x1234123412341234123412341234123412341234123412341234123412341234';
        // TODO: add the necessary query to get the information from the DB
        // this._checkConnected();
        // const query = `
        //   SELECT *
        //   FROM $1
        //   WHERE hash = $2`;
        // const values = [table, hash];

    // const res = await this.client.query(query, values);
    // return res.rows[0];
    }
}

module.exports = SqlDb;
