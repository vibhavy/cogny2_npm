const crypto = require('node:crypto');

module.exports = class TokenPair {
    
    /**
     * @description generate access token pair
     * @returns 
     */
    generateAccessTokenPair(modulusLength = 4096) {
        try {
            // Generate an EC key pair
            const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: modulusLength,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem',
                    cipher: 'aes-256-cbc',
                    passphrase: ''
                }
            });
            return {
                verifierKey: privateKey,
                generatorKey: publicKey
            }
        } catch (err) {
            throw new Error(err.message);
        }
    }

}