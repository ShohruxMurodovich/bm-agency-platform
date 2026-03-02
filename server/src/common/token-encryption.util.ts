import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = process.env.TOKEN_ENCRYPTION_KEY || 'a'.repeat(64); // 32-byte key in hex; override via env

function getKey(): Buffer {
    return Buffer.from(KEY_HEX, 'hex');
}

export interface EncryptedToken {
    encrypted: string; // hex
    iv: string;        // hex
    authTag: string;   // hex
}

/**
 * Encrypt a plain-text token using AES-256-GCM.
 * Returns three separate fields for DB storage.
 */
export function encryptToken(plain: string): EncryptedToken {
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
        encrypted: encrypted.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
    };
}

/**
 * Decrypt an AES-256-GCM encrypted token back to plain text.
 * Throws if auth tag verification fails (tampered data).
 */
export function decryptToken(fields: EncryptedToken): string {
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        getKey(),
        Buffer.from(fields.iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(fields.authTag, 'hex'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(fields.encrypted, 'hex')),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}

/**
 * Convenience: decrypt token from a Store-like object.
 * Returns null if no encrypted token is present.
 */
export function decryptStoreToken(store: {
    encrypted_token?: string;
    token_iv?: string;
    token_auth_tag?: string;
}): string | null {
    if (!store.encrypted_token || !store.token_iv || !store.token_auth_tag) {
        return null;
    }
    try {
        return decryptToken({
            encrypted: store.encrypted_token,
            iv: store.token_iv,
            authTag: store.token_auth_tag,
        });
    } catch {
        return null; // Auth tag mismatch or corrupted
    }
}
