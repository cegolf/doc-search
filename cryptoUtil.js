import crypto from 'crypto';
import 'dotenv/config'; // Load environment variables from .env file

const ALGORITHM_NAME = process.env.ALGO
const ALGORITHM_NONCE_SIZE = parseInt(process.env.ALGORITHM_NONCE_SIZE)
const ALGORITHM_TAG_SIZE = parseInt(process.env.ALGORITHM_TAG_SIZE);
const ALGORITHM_KEY_SIZE = parseInt(process.env.ALGORITHM_KEY_SIZE);
const PBKDF2_NAME = process.env.PBKDF2_NAME;
const PBKDF2_SALT_SIZE = parseInt(process.env.PBKDF2_SALT_SIZE);
const PBKDF2_ITERATIONS = parseInt(process.env.PBKDF2_ITERATIONS);



export function encryptString(plaintext, password) {
    // Generate a 128-bit salt using a CSPRNG.
    let salt = crypto.randomBytes(PBKDF2_SALT_SIZE);

    // Derive a key using PBKDF2.
    let key = crypto.pbkdf2Sync(Buffer(password, "utf8"), salt, PBKDF2_ITERATIONS, ALGORITHM_KEY_SIZE, PBKDF2_NAME);

    // Encrypt and prepend salt.
    let ciphertextAndNonceAndSalt = Buffer.concat([ salt, encrypt(Buffer(plaintext, "utf8"), key) ]);

    // Return as base64 string.
    return ciphertextAndNonceAndSalt.toString("base64");
}

export function decryptString(base64CiphertextAndNonceAndSalt, password) {
    // Decode the base64.
    let ciphertextAndNonceAndSalt = Buffer(base64CiphertextAndNonceAndSalt, "base64");

    // Create buffers of salt and ciphertextAndNonce.
    let salt = ciphertextAndNonceAndSalt.slice(0, PBKDF2_SALT_SIZE);
    let ciphertextAndNonce = ciphertextAndNonceAndSalt.slice(PBKDF2_SALT_SIZE);

    // Derive the key using PBKDF2.
    let key = crypto.pbkdf2Sync(Buffer(password, "utf8"), salt, PBKDF2_ITERATIONS, ALGORITHM_KEY_SIZE, PBKDF2_NAME);

    // Decrypt and return result.
    return decrypt(ciphertextAndNonce, key).toString("utf8");
}

export function encrypt(plaintext, key) {
    // Generate a 96-bit nonce using a CSPRNG.
    let nonce = crypto.randomBytes(ALGORITHM_NONCE_SIZE);

    // Create the cipher instance.
    let cipher = crypto.createCipheriv(ALGORITHM_NAME, key, nonce);

    // Encrypt and prepend nonce.
    let ciphertext = Buffer.concat([ cipher.update(plaintext), cipher.final() ]);

    return Buffer.concat([ nonce, ciphertext, cipher.getAuthTag() ]);
}

export function decrypt(ciphertextAndNonce, key) {
    // Create buffers of nonce, ciphertext and tag.
    let nonce = ciphertextAndNonce.slice(0, ALGORITHM_NONCE_SIZE);
    let ciphertext = ciphertextAndNonce.slice(ALGORITHM_NONCE_SIZE, ciphertextAndNonce.length - ALGORITHM_TAG_SIZE);
    let tag = ciphertextAndNonce.slice(ciphertext.length + ALGORITHM_NONCE_SIZE);

    // Create the cipher instance.
    let cipher = crypto.createDecipheriv(ALGORITHM_NAME, key, nonce);

    // Decrypt and return result.
    cipher.setAuthTag(tag);
    return Buffer.concat([ cipher.update(ciphertext), cipher.final() ]);
}