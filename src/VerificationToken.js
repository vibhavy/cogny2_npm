const crypto = require('node:crypto');
const applicationConstants = require('./constants/application');
const { ERROR_CODE } = applicationConstants;

module.exports = class VerificationToken {

    /**
     * @description access token module
     * @param {String} applicationToken 
     * @param {String} generatorKey 
     * @param {String} verifierKey 
     */
    constructor({generatorKey, verifierKey }) {
        this.generatorKey = generatorKey;
        this.verifierKey = verifierKey;
        this.payload = {};
    }

    /**
     * @description generate ciphered token
     * @param {String} generatorKey 
     */
    async generate(payload = {}, ttl = 60) {
        try {
            if (!this.generatorKey)
                throw new Error(ERROR_CODE.MISSING_GENERATOR_KEY);
            const plainObj = {
                date: new Date(),
                ttl: ttl,
                applicationToken: this.applicationToken,
                payload: payload
            };
            const plainText = JSON.stringify(plainObj);
            return this.#encrypt(this.generatorKey, plainText);
        } catch (err) {
            throw new Error(err.message);
        }
    }

    /**
     * @description return's token's payload object
     * @returns token's payload object
     */
    getPayload() {
        return this.payload;
    }

    /**
     * @description verfiy encrypted token
     * @param {String} encryptedToken 
    */
    async verify(encryptedToken) {
        let verified = false;
        let errorCode = null;
        try {
            try {
                if (!this.verifierKey)
                    throw new Error('MISSING_VERIFIER_KEY');
                const decipheredText = this.#decrypt(this.verifierKey, encryptedToken);
                const decipheredJson = JSON.parse(decipheredText);
                const applicationToken = decipheredJson.applicationToken;
                if (applicationToken !== this.applicationToken)
                    throw new Error('APPLICATION_TOKEN_MISMATCH');
                const cDate = new Date();
                const tDate = new Date(decipheredJson.date);
                const allowedTTL = decipheredJson.ttl ?? 0;
                const timeDifference = (cDate - tDate) / 1000;
                if (allowedTTL < timeDifference)
                    throw new Error('TOKEN_EXPIRED');
                this.payload = decipheredJson.payload ?? {};
                verified = true;
            } catch (err) {
                errorCode = err.message;
                throw new Error(err.message);
            } 
            finally { 
                if(errorCode)
                    throw new Error(ERROR_CODE[errorCode]);
                return verified;
            }
        } catch(err) {
            throw new Error(err.message);
        }
    }
    
    /**
     * @description encrypt plain text
     * @param {String} generatorKey 
     * @param {String} plainText
     */
    #encrypt(generatorKey, plainText) {
        try {
            return crypto
            .publicEncrypt(generatorKey, Buffer.from(plainText))
            .toString("base64");
        } catch (err) {
            throw err;
        }
    }

    /**
     * @description decrypt ciphered text
     * @param {String} verifierKey 
     * @param {String} encryptedText 
     */
    #decrypt(verifierKey, encryptedText) {
        try {
            const decrypted = crypto.privateDecrypt(
                {
                    key: verifierKey,
                    passphrase: '',
                },
                Buffer.from(encryptedText, "base64")
            );
            return decrypted.toString("utf8");
        } catch (err) {
            throw err;
        }
    }
}