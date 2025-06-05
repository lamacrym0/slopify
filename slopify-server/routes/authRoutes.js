import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { db } from "../db/client.js";
import { hashPassword } from "../auth/password.js";
import { getCookieOptions, authenticateToken } from "../auth/middleware.js";
import { UserSchema } from "../models/UserSchema.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { email, password, firstname, lastname } = req.body;
  const lowerEmail = email.toLowerCase();
  const existing = await db.collection("users").findOne({ email: lowerEmail });
  if (existing) return res.status(409).json({ message: "Email déjà utilisé" });

  const hashed = await hashPassword(password);
  const userData = {
    email: lowerEmail,
    password: hashed,
    firstname,
    lastname
  };

  try {
    UserSchema.validate(userData);
    const result = await db.collection("users").insertOne(userData);
    const token = jwt.sign({ id: result.insertedId, email: lowerEmail }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token", token, getCookieOptions());
    res.sendStatus(200);
  } catch (err) {
    res.status(400).json({ message: "Inscription échouée", error: err.message });
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || "Échec de la connexion" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token", token, getCookieOptions());
    res.sendStatus(200);
  })(req, res, next);
});

router.get("/me", authenticateToken, async (req, res) => {
  const user = await db.collection("users").findOne({ email: req.user.email });
  if (!user) return res.sendStatus(404);
  delete user.password;
  res.json({ user });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", getCookieOptions()).sendStatus(200);
});

export default router;
