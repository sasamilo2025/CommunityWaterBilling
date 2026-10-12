// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// Password Security Utilities
// ==================================================

// --------------------------------------------------
// IMPORT ARGON2
// --------------------------------------------------
// Argon2 is a password-hashing library.
//
// We use Argon2id to protect user passwords.
// The original password is NEVER stored in MySQL.

const argon2 = require("argon2");

// --------------------------------------------------
// FUNCTION 1: HASH PASSWORD
// --------------------------------------------------
// Converts a plain-text password into a secure hash.
//
// This function will be used when:
// - Creating a new user account
// - Changing an existing password
//
// The function returns a hash suitable for storing
// in the users.password_hash database column.

async function hashPassword(password) {
    return await argon2.hash(password, {
        type: argon2.argon2id
    });
}

// --------------------------------------------------
// FUNCTION 2: VERIFY PASSWORD
// --------------------------------------------------
// Compares a password entered during login with
// the password hash stored in MySQL.
//
// Returns:
// true  = Password matches
// false = Password does not match
//
// The original password cannot be recovered
// from the stored hash.

async function verifyPassword(passwordHash, password) {
    return await argon2.verify(passwordHash, password);
}

// --------------------------------------------------
// EXPORT FUNCTIONS
// --------------------------------------------------
// Allows other backend files to use these functions.
//
// Example:
// const { hashPassword, verifyPassword } =
//     require("./utils/passwordUtils");

module.exports = {
    hashPassword,
    verifyPassword
};