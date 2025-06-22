import express from "express";
import {
  login,
  register,
  getUser,
  getAllUsers,
} from "../controllers/userController";
import { createFighter, seekFighters } from "../controllers/fighterController";
import {
  getAllCards,
  getEquippedCard,
  getOwnedCards,
  postEquippedCard,
} from "../controllers/cardController";
import {
  getEquippedItems,
  equipmentUpdate,
} from "../controllers/equipmentController";
import {
  saveCombatResult,
  getUserCombatHistory,
} from "../controllers/combatController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

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
router.post("/update-cards", authMiddleware, postEquippedCard);
router.get("/equipped-cards/:fighter_id", authMiddleware, getEquippedCard);

//Equipment Routes
router.get("/equipment/:user_id", authMiddleware, getEquippedItems);
router.post("/equipment/update", authMiddleware, equipmentUpdate);
//Battle routes

router.post("/combat-result", authMiddleware, saveCombatResult);
router.get("/combat-history/:fighter_id", authMiddleware, getUserCombatHistory);

export default router;
