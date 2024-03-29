const protoLoader = require('@grpc/proto-loader');
const grpc = require('@grpc/grpc-js');

describe('Compile zk_prover proto', () => {
    const PROTO_PATH = `${__dirname}/../proto/zkprover/v1/zk_prover.proto`;

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
