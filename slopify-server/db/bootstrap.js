import { db } from "./client.js";
import { events } from "../data/eventsData.js";
import { EventSchema } from "../models/EventSchema.js";

export async function bootstrapEvents() {
  const collection = db.collection("events");

  const count = await collection.countDocuments();
  if (count > 0) {
    console.log("Événements déjà présents dans la base.");
    return;
  }

  const validated = [];

  for (const event of events) {
    try {
      const cleanEvent = EventSchema.clean(event);
      EventSchema.validate(cleanEvent);
      validated.push(cleanEvent);
    } catch (err) {
      console.error("Événement invalide :", err.message);
    }
  }

  if (validated.length) {
    await collection.insertMany(validated);
    console.log(`${validated.length} événements insérés.`);
  }
}
