const protoLoader = require('@grpc/proto-loader');
const grpc = require('@grpc/grpc-js');

describe('Compile mt proto', () => {
    const PROTO_PATH = `${__dirname}/../proto/hashdb/v1/hashdb.proto`;

    it('compile', async () => {
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
        grpc.loadPackageDefinition(packageDefinition).zkprover;
    });
});