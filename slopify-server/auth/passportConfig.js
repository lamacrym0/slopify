import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "../db/client.js";
import { comparePassword } from "./password.js";

// Configuration Passport "local"
passport.use("local", new LocalStrategy({
  usernameField: "email", // important
  passwordField: "password"
}, async (email, password, done) => {
  try {
    const user = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (!user) return done(null, false, { message: "Utilisateur non trouvé" });

    const match = await comparePassword({ user, password });
    if (!match) return done(null, false, { message: "Mot de passe incorrect" });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));
