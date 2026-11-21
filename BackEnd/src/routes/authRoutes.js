const express = require("express");
const authMiddleware = require("../middleware/auth");
const authController = require("../controllers/authController");

const router = express.Router();

// Account
router.post("/register-organisation", authController.registerOrganisation);
router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.getMe);
router.get("/users", authMiddleware, authController.getUsers);
router.delete("/users/:userId", authMiddleware, authController.removeUser);
router.patch("/users/:userId/role", authMiddleware, authController.changeRole);

// Invites (admin invites by email, the new user sets their own password)
router.post("/invite", authMiddleware, authController.inviteUser);
router.post("/invite/:userId/resend", authMiddleware, authController.resendInvite);
router.get("/invite/verify", authController.verifyInvite);
router.post("/accept-invite", authController.acceptInvite);

// Forgot / reset password
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
