export type AuthUser = {
    id: string;
    email: string;
    name?: string;
    role: string;
};

export type AuthOrganisation = {
    id: string,
    name: string;
    // slug??
};

export type LoginResponse = {
    token: string;
    user: AuthUser;
    organisation: AuthOrganisation;
};