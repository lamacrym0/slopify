import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db(process.env.DB_NAME);

export { client, db };
