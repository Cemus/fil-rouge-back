import { Request, Response } from "express";
import { CustomRequest } from "../types/types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { createInitialCollection } from "./cardController";
import { getFighter } from "./fighterController";
import { getCardCollection } from "./cardController";
import { getUserEquipments } from "./equipmentController";

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const client = await db.connect();

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    //transaction
    await client.query("BEGIN");

    //create user
    const userResult = await db.query(
      `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id`,
      [username, hashedPassword]
    );
    const newUserId = userResult.rows[0].id;

    //first cards
    await createInitialCollection({ id: newUserId }, client);

    //commit
    await db.query("COMMIT");

    const token = jwt.sign(
      { id: newUserId },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1h",
      }
    );

    res.status(201).json({ token });
  } catch (error: any) {
    await db.query("ROLLBACK");
    console.error("Error during register:", error);

    const errorMessage =
      error.code === "23505" ? "Username already in use" : "An error occurred";

    res.status(400).json({ error: errorMessage });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  try {
    const userResult = await db.query(
      `SELECT id, password FROM users WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
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

export const getUser = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const { id } = req.user || {};

    if (!id) {
      throw new Error("No id given.");
    }

    const userResult = await db.query(
      `SELECT id, username, currency FROM users WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    const fightersWithDetails = await getFighter(id);
    const cardCollection = await getCardCollection(id);
    const equipmentCollection = await getUserEquipments(id);

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

export const getAllUsers = async (_: any, res: Response): Promise<void> => {
  try {
    const usersResult = await db.query(`SELECT id, username FROM users`);

    if (usersResult.rows.length === 0) {
      res.status(404).json({ error: "No users found" });
    }

    res.status(200).json(usersResult.rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
