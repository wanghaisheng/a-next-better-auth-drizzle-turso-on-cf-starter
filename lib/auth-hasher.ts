/*
 * Cloudflare Pages edge-runtime-cpu-limit-friendly password hashers
 */

/**
 * Hashes a password using PBKDF2 with the Web Crypto API
 * @param password The plain text password to hash
 * @returns A promise that resolves to the encoded hash string
 */
export async function hash(password: string): Promise<string> {
    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Convert password to buffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Use PBKDF2 with HMAC SHA-256
    const iterations = 100000; // Adjust based on performance needs
    const keyLength = 32; // 256 bits

    // Import password as key
    const importedKey = await crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        { name: "PBKDF2" },
        false,
        ["deriveBits"],
    );

    // Derive bits using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations,
            hash: "SHA-256",
        },
        importedKey,
        keyLength * 8,
    );

    // Combine salt and derived key for storage
    const result = new Uint8Array(salt.length + keyLength);
    result.set(salt);
    result.set(new Uint8Array(derivedBits), salt.length);

    // Return as base64 string for storage
    return btoa(String.fromCharCode(...result));
}

/**
 * Verifies a password against a hash
 * @param params Object containing the hash and password to verify
 * @returns A promise that resolves to true if the password matches the hash
 */
export async function verify(params: {
    hash: string;
    password: string;
}): Promise<boolean> {
    const { hash, password } = params;

    try {
        // Decode the stored hash
        const hashBuffer = Uint8Array.from(atob(hash), (c) => c.charCodeAt(0));

        // Extract salt (first 16 bytes) and the original derived key
        const salt = hashBuffer.slice(0, 16);
        const storedKey = hashBuffer.slice(16);

        // Convert password to buffer
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        // Import password as key
        const importedKey = await crypto.subtle.importKey(
            "raw",
            passwordBuffer,
            { name: "PBKDF2" },
            false,
            ["deriveBits"],
        );

        // Derive bits using same parameters
        const iterations = 100000; // Must match the hash function
        const keyLength = 32; // Must match the hash function

        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                salt,
                iterations,
                hash: "SHA-256",
            },
            importedKey,
            keyLength * 8,
        );

        // Convert to Uint8Array for comparison
        const newKey = new Uint8Array(derivedBits);

        // Check if the derived key matches the stored key
        if (storedKey.length !== newKey.length) return false;

        // Time-constant comparison to prevent timing attacks
        let result = 0;
        for (let i = 0; i < storedKey.length; i++) {
            result |= storedKey[i] ^ newKey[i];
        }

        return result === 0;
    } catch {
        return false;
    }
}
