// What each role is allowed to do. Keep in step with
// FrontEnd/constants/permissions.ts, which hides the buttons.
//
//   trackside - record what happens at the track: runs, laps, fuel, tyre
//               pressures, tyre notes, tyres on a run, setup used, issues
//   setups    - create and edit setups and custom setup fields
//   manage    - events, vehicles, drivers, tyre inventory, tracks, and
//               removing / restoring things
//   admin     - users and organisation settings
const PERMISSIONS = {
    trackside: ["admin", "engineer", "mechanic"],
    setups: ["admin", "engineer", "mechanic"],
    manage: ["admin", "engineer"],
    admin: ["admin"],
};

function can(role, permission) {
    return (PERMISSIONS[permission] || []).includes(role);
}

// Route middleware - use after the auth middleware
function requirePermission(permission) {
    if (!PERMISSIONS[permission]) {
        throw new Error(`Unknown permission "${permission}"`);
    }

    return (req, res, next) => {
        if (!req.user || !can(req.user.role, permission)) {
            return res.status(403).json({ message: "Your role doesn't allow this" });
        }
        next();
    };
}

module.exports = { PERMISSIONS, can, requirePermission };
