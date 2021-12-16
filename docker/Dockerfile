# CONTAINER FOR RUNNING MOCK-PROVER
FROM node:16

# BUILD REPO
COPY . /src
WORKDIR /src
RUN npm i

EXPOSE 50051

CMD ["node","zk-prover-server.js"]