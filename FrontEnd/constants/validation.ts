// Email and password rules - the same as the backend
// (BackEnd/src/utils/validation.js), checked here so users see problems
// before submitting.

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export const INVALID_EMAIL_MESSAGE = "Please enter a valid email address";

// Something@something.something, no spaces
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string) {
    const value = email.trim().toLowerCase();
    return value.length <= 254 && EMAIL_PATTERN.test(value);
}

// Each password rule, for the live checklist under password boxes
export function passwordChecks(password: string) {
    return [
        { label: `${MIN_PASSWORD_LENGTH}+ characters`, met: password.length >= MIN_PASSWORD_LENGTH },
        { label: "A letter", met: /[A-Za-z]/.test(password) },
        { label: "A number", met: /[0-9]/.test(password) },
    ];
}

// Returns a message if the password breaks a rule, otherwise null
export function passwordProblem(password: string) {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
        return `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer`;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return "Password must include at least one letter and one number";
    }
    return null;
}
