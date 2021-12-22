/**
 * Converts hexadecimal string into bytea sql format
 * @param {String} str hexadecimal string
 * @returns {Buffer} bytea buffer
 */
function str2Bytea(hexStr) {
    if (hexStr.substr(0, 2) === '0x') {
        return Buffer.from(hexStr.substr(2), 'hex');
    }
    return Buffer.from(hexStr, 'hex');
}

/**
 * Converts buffer to hex string
 * @param {Buffer} bytea buffer
 * @param {String} hexadecimal string
 */
function bytea2Str(bytea) {
    return `0x${bytea.toString('hex')}`;
}

function isFinalNode(siblings) {
    const firstSibling = Buffer.alloc(32);
    firstSibling[31] = 0x01;

    return Buffer.compare(str2Bytea(siblings[0]), firstSibling) === 0;
}

async function getNodes(iSql, root, arity, hashTable) {
    const { data } = await iSql.getMerkleTree(root);

    // get siblings from data
    const siblings = [];
    for (let i = 0; i < 2 ** arity; i++) {
        siblings.push(bytea2Str(data.slice(i * 32, (i + 1) * 32)).slice(2));
    }

    hashTable[root] = siblings;

    if (!isFinalNode(siblings)) {
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (Buffer.compare(Buffer.alloc(32), str2Bytea(sibling)) !== 0) {
                // eslint-disable-next-line no-await-in-loop
                await getNodes(iSql, sibling, arity, hashTable);
            }
        }
    }

    return hashTable;
}

async function getHashTableFromSql(iSql, root, arity) {
    const hashTable = {};

    await getNodes(iSql, root, arity, hashTable);

    return hashTable;
}

module.exports = {
    getHashTableFromSql,
    str2Bytea,
    bytea2Str,
};
