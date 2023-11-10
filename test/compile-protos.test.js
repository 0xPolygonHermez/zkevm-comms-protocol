const protoLoader = require('@grpc/proto-loader');
const grpc = require('@grpc/grpc-js');
const path = require('path');

describe('Compile All protos', () => {
    it('compile aggregator', async () => {
        const PROTO_PATH = `${__dirname}/../proto/aggregator/v1/aggregator.proto`;

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

        // eslint-disable-next-line no-unused-expressions
        grpc.loadPackageDefinition(packageDefinition).aggregator;
    });

    it('compile executor', async () => {
        const PROTO_PATH = `${__dirname}/../proto/executor/v1/executor.proto`;

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

        // eslint-disable-next-line no-unused-expressions
        grpc.loadPackageDefinition(packageDefinition).executor;
    });

    it('compile hashdb', async () => {
        const PROTO_PATH = `${__dirname}/../proto/hashdb/v1/hashdb.proto`;

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

        // eslint-disable-next-line no-unused-expressions
        grpc.loadPackageDefinition(packageDefinition).hashdb;
    });
});