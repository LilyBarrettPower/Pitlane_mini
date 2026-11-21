// Set EXPO_PUBLIC_API_URL when the backend lives somewhere else (e.g. when hosted)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

// Called when a logged-in request is rejected (removed user or expired
// login). AuthContext registers a handler that logs the user out.
let onUnauthorized: ((message: string) => void) | null = null;

export function setUnauthorizedHandler(handler: ((message: string) => void) | null) {
    onUnauthorized = handler;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        // Only for requests sent with a login token - a wrong password on the
        // login page is also a 401 and must not trigger a logout
        if (response.status === 401 && headers.Authorization && onUnauthorized) {
            onUnauthorized(data.message || "Your session has ended. Please log in again.");
        }

        throw new Error(data.message || "Request failed");
    }

    return data;
}
