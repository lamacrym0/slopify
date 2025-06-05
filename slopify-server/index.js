import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import authRoutes from "./routes/authRoutes.js";
import "./auth/passportConfig.js";
import { client, db } from "./db/client.js";
import { bootstrapEvents } from "./db/bootstrap.js";
import { authenticateToken } from "./auth/middleware.js";
import { ApolloServer } from "apollo-server-express";
import typeDefs from "./graphql/types.js";
import resolvers from "./graphql/resolvers.js";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 3000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use(authRoutes);

// Route protégée
app.get("/events", authenticateToken, async (req, res) => {
  const events = await db.collection("events").find().toArray();
  res.json(events);
});



const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.cookies?.token;
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      return { user };
    } catch {
      return {};
    }
  },
});

await apolloServer.start();
apolloServer.applyMiddleware({ app, cors: false });
app.listen(PORT, async () => {
  await client.connect();
  await bootstrapEvents();
  console.log(`🚀 Slopify backend en ligne sur http://localhost:${PORT}`);
});
