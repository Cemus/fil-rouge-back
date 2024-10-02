const express = require("express");
const router = express.Router();
const {
  login,
  register,
  getUser,
  getAllUsers,
} = require("../controllers/userController");
const {
  createFighter,
  seekFighters,
} = require("../controllers/fighterController");
const {
  getAllCards,
  getEquippedCard,
  getOwnedCards,
  postEquippedCard,
} = require("../controllers/cardController");
const {
  getEquippedItems,
  equipmentUpdate,
} = require("../controllers/equipmentController");
const {
  saveCombatResult,
  getUserCombatHistory,
} = require("../controllers/combatController");
const authMiddleware = require("../middleware/authMiddleware");

// User routes
router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getUser);
router.get("/players", getAllUsers);

//Fighter routes
router.post("/seek-fighters", authMiddleware, seekFighters);
router.post("/create-fighter", authMiddleware, createFighter);

//Card Routes
router.get("/all-cards", authMiddleware, getAllCards);
router.get("/owned-cards", authMiddleware, getOwnedCards);
router.post("/equipped-cards", authMiddleware, postEquippedCard);
router.get("/equipped-cards/:fighter_id", authMiddleware, getEquippedCard);

//Equipment Routes
router.get("/equipment/:user_id", authMiddleware, getEquippedItems);
router.post("/equipment/update", authMiddleware, equipmentUpdate);
//Battle routes

router.post("/combat-result", authMiddleware, saveCombatResult);
router.get("/combat-history/:fighter_id", authMiddleware, getUserCombatHistory);

module.exports = router;
