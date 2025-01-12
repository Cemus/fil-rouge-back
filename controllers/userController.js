const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { createInitialCollection } = require("./cardController");
const { getFighter } = require("./fighterController");
const { getCardCollection } = require("./cardController");
const { getUserEquipments } = require("./equipmentController");

const register = async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    //transaction
    await db.query("BEGIN");

    //create user
    const userResult = await db.query(
      `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id`,
      [username, hashedPassword]
    );
    const newUserId = userResult.rows[0].id;

    //first cards
    await createInitialCollection(newUserId);

    //commit
    await db.query("COMMIT");

    const token = jwt.sign({ id: newUserId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({ token });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Erreur lors de l'inscription :", error);

    const errorMessage =
      error.code === "23505"
        ? "Username is already in use"
        : "An error occurred";

    res.status(400).json({ error: errorMessage });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const userResult = await db.query(
      `SELECT id, password FROM users WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const fightersResult = await db.query(
      `SELECT id FROM fighters WHERE user_id = $1`,
      [user.id]
    );

    res
      .status(200)
      .json({ token, hasFighters: fightersResult.rows.length > 0 });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await db.query(
      `SELECT id, username, currency FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    const fightersWithDetails = await getFighter(userId);
    const cardCollection = await getCardCollection(userId);
    const equipmentCollection = await getUserEquipments(userId);

    const userProfile = {
      ...user,
      cardCollection: cardCollection,
      equipmentCollection: equipmentCollection,
      fighters: fightersWithDetails,
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const usersResult = await db.query(`SELECT id, username FROM users`);

    if (usersResult.rows.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }

    res.status(200).json(usersResult.rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  register,
  login,
  getUser,
  getAllUsers,
};
