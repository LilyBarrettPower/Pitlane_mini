// What each role can do. Keep in step with
// BackEnd/src/middleware/permissions.js, which enforces it - this file
// only decides which buttons to show.
//
//   trackside - runs, laps, fuel, tyre pressures, tyre notes, tyres on a run, setup used
//   setups    - create and edit setups and custom setup fields
//   manage    - events, vehicles, drivers, tyre inventory, tracks, removing things
//   admin     - users and organisation settings

import { useAuth } from "../context/AuthContext";

export type Permission = "trackside" | "setups" | "manage" | "admin";

export const ROLES = ["admin", "engineer", "mechanic", "viewer"] as const;
export type Role = (typeof ROLES)[number];

const PERMISSIONS: Record<Permission, readonly Role[]> = {
    trackside: ["admin", "engineer", "mechanic"],
    setups: ["admin", "engineer", "mechanic"],
    manage: ["admin", "engineer"],
    admin: ["admin"],
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
    admin: "Everything, plus users and organisation settings",
    engineer: "Plan events, manage cars, drivers, tyres and tracks, and remove things",
    mechanic: "Record runs, laps, fuel, tyres and notes, and edit setups",
    viewer: "Read only",
};

export function can(role: string | undefined | null, permission: Permission) {
    return !!role && (PERMISSIONS[permission] as readonly string[]).includes(role);
}

// const canManage = useCan("manage");
export function useCan(permission: Permission) {
    const { user } = useAuth();
    return can(user?.role, permission);
}
