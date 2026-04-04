const API_BASE_URL = 'http://localhost:5000';


export async function apiFetch(path: string, options: RequestInit ={}) {
    const response = await fetch(`${API_BASE_URL}$path`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || 'Request failed');
    }

    return data;
}