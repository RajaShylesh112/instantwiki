import { scryptSync, randomBytes, timingSafeEqual } from "crypto"

/**
 * Hashes a plain-text password using Node's native scrypt algorithm.
 * Returns the hash formatted as `salt:hash` in hex.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

/**
 * Verifies a plain-text password against a stored hash (format: `salt:hash`).
 * Uses timingSafeEqual to protect against timing attacks.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":")
    if (!salt || !hash) return false
    const targetHash = scryptSync(password, salt, 64).toString("hex")
    return timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(targetHash, "hex")
    )
  } catch (err) {
    console.error("Password verification error:", err)
    return false
  }
}
