const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sequelize = require("../db");
const { createInitialCollection } = require("./cardController");
const { getFighterIncludeOptions } = require("./fighterController");
const User = require("../models/User");
const Fighter = require("../models/fighter/Fighter");
const { getUserEquipments } = require("./equipmentController");
require("../models/indexModel");

const register = async (req, res) => {
  console.log("registering");
  const { username, password } = req.body;
  const transaction = await sequelize.transaction();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create(
      {
        username,
        password: hashedPassword,
      },
      { transaction }
    );

    await createInitialCollection(newUser, transaction);

    await transaction.commit();

    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log(`${username} registered`);

    res.status(201).json({ token });
  } catch (error) {
    await transaction.rollback();
    console.log(`${username} registration cancelled`);
    res.status(400).json({ error: "Registration error" });
  }
};

const login = async (req, res) => {
  console.log("logging in");
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log("connection failed with", username, ": invalid password");
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const fighters = await Fighter.findAll({ where: { user_id: user.id } });

    console.log(`${username} logged in`);
    res.status(200).json({ token, hasFighters: fighters.length > 0 });
  } catch (error) {
    console.log("code error : ", error.code);

    res.status(500).json({ error: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    console.log("GET USER!", req.user.id);
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "username"],
      include: [
        {
          model: Fighter,
          include: getFighterIncludeOptions(),
        },
      ],
    });
    if (!user) {
      throw new Error("User not found");
    }
    const equipments = await getUserEquipments(req.user.id);
    const fightersWithEquipments = user.fighters.map((fighter) => ({
      ...fighter.toJSON(),
      equipments: equipments,
    }));

    res.status(200).json({
      ...user.toJSON(),
      fighters: fightersWithEquipments,
    });
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    console.log("GET ALL USER!");
    const users = await User.findAll({
      attributes: ["id", "username"],
    });

    if (!users.length) {
      return res.status(404).json({ error: "No users found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des noms d'utilisateurs:",
      error
    );
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

module.exports = {
  register,
  login,
  getUser,
  getAllUsers,
};
