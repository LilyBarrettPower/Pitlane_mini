// Shared rules for emails and passwords. The app (FrontEnd/constants/validation.ts)
// uses the same rules so users see problems before submitting.

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// Something@something.something, no spaces
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normaliseEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
    const value = normaliseEmail(email);
    return value.length <= 254 && EMAIL_PATTERN.test(value);
}

// Returns a message if the password breaks a rule, otherwise null
function passwordProblem(password) {
    const value = String(password || "");

    if (value.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (value.length > MAX_PASSWORD_LENGTH) {
        return `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer`;
    }
    if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
        return "Password must include at least one letter and one number";
    }
    return null;
}

module.exports = { isValidEmail, normaliseEmail, passwordProblem, MIN_PASSWORD_LENGTH };
