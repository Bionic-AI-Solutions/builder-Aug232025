import crypto from 'crypto';

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-here';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Encrypt sensitive data (like API keys)
 */
export function encrypt(text: string): string {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
        cipher.setAAD(Buffer.from('llm-provider-key', 'utf8'));

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const tag = cipher.getAuthTag();

        // Combine IV, encrypted data, and auth tag
        return iv.toString('hex') + ':' + encrypted + ':' + tag.toString('hex');
    } catch (error) {
        console.error('[ENCRYPTION ERROR]', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
    try {
        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const tag = Buffer.from(parts[2], 'hex');

        const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
        decipher.setAAD(Buffer.from('llm-provider-key', 'utf8'));
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('[DECRYPTION ERROR]', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Check if data is encrypted
 */
export function isEncrypted(data: string): boolean {
    return data.includes(':') && data.split(':').length === 3;
}

/**
 * Mask sensitive data for display
 */
export function maskApiKey(apiKey: string): string {
    if (!apiKey) return '';
    if (apiKey.length <= 8) return '***';
    return apiKey.substring(0, 4) + '***' + apiKey.substring(apiKey.length - 4);
}
