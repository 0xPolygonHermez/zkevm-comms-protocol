function timeout(ms) {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Convert a hex string to a byte array
function hexToBytes(hex) {
    let bytes;
    let c;
    for (bytes = [], c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return bytes;
}

// Convert a byte array to a hex string
function bytesToHex(bytes) {
    let hex;
    let i;
    for (hex = [], i = 0; i < bytes.length; i++) {
        const current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
        hex.push((current >>> 4).toString(16));
        hex.push((current & 0xF).toString(16));
    }
    return hex.join('');
}

module.exports = {
    timeout,
    hexToBytes,
    bytesToHex,
};
