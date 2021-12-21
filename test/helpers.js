const fs = require('fs');

/**
 * Find string and replace it with the value
 * @param {String} stringToFind - target string
 * @param {String} key - key to look for
 * @param {String} value - value to replace
 * @returns {String} string replaced
 */
function _findAndReplace(stringToFind, key, value) {
    const params = stringToFind.split('\n');

    for (let i = 0; i < params.length; i++) {
        if (params[i].includes(`${key}`)) {
            params[i] = `${key}=${value}`;
        }
    }

    return params.join('\n');
}

/**
 * Modify environment file
 * @param {String} envPath - environment file path
 * @param {Array[String]} keys - array keys to insert in the environment file
 * @param {Array[String]} value - array values to insert in the environment file
 * @returns old environment file
 */
async function setEnvFile(envPath, keys, values) {
    if (keys.length !== values.length) {
        throw new Error('setPrivateEnv function: mismatch key-values length');
    }

    let oldStringPrivate;
    let newStringPrivate = '';

    if (fs.existsSync(envPath)) {
        oldStringPrivate = fs.readFileSync(envPath).toString();
        newStringPrivate = oldStringPrivate;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = values[i];

            if (newStringPrivate.includes(key)) {
                newStringPrivate = _findAndReplace(newStringPrivate, key, value);
            } else {
                newStringPrivate += `\n${key}=${value}`;
            }
        }
    } else {
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = values[i];

            newStringPrivate += `\n${key}=${value}`;
        }
    }

    await fs.writeFileSync(envPath, newStringPrivate);

    return oldStringPrivate;
}

module.exports = {
    setEnvFile,
};
