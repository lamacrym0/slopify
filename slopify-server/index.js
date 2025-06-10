import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { authenticateToken } from "./auth/middleware.js";
import typeDefs from './graphql/types.js';
import resolvers from './graphql/resolvers.js';

import authRoutes from './routes/authRoutes.js';
import './auth/passportConfig.js';
import { client, db } from './db/client.js';
import { bootstrapEvents } from './db/bootstrap.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;




app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json()); 
app.use(cookieParser());
app.use(passport.initialize());

app.use(authRoutes);

app.get("/events", authenticateToken, async (req, res) => {
  const events = await db.collection("events").find().toArray();
  res.json(events);
});

const apolloServer = new ApolloServer({ typeDefs, resolvers });
await apolloServer.start();

app.use('/graphql', expressMiddleware(apolloServer, {
  context: async ({ req }) => {
    const token = req.cookies?.token;
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      return { user };
    } catch {
      return {};
    }
  }
}));

app.listen(PORT, async () => {
  await client.connect();
  await bootstrapEvents();
  console.log(`Backend Slopify prêt : http://localhost:${PORT}`);
  console.log(`GraphQL disponible sur : http://localhost:${PORT}/graphql`);
});
