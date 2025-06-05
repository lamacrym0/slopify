import { db } from "../db/client.js";
import { ObjectId } from "mongodb";
import { EventSchema } from "../models/EventSchema.js";

const events = async (_, __, context) => {
  if (!context.user) throw new Error("Unauthorized");
  return await db.collection("events").find().toArray();
};

const myEvents = async (_, __, context) => {
  if (!context.user) throw new Error("Unauthorized");
  return await db.collection("events").find({ createdBy: context.user.id }).toArray();
};

const createEvent = async (_, args, context) => {
  if (!context.user) throw new Error("Unauthorized");

  const event = {
    ...args,
    createdBy: context.user.id,
  };

  EventSchema.validate(event);
  const result = await db.collection("events").insertOne(event);
  return { ...event, _id: result.insertedId };
};

const updateEvent = async (_, { eventId, ...rest }, context) => {
  if (!context.user) throw new Error("Unauthorized");

  const existing = await db.collection("events").findOne({ _id: new ObjectId(eventId) });
  if (!existing || existing.createdBy !== context.user.id)
    throw new Error("Forbidden");

  const updated = { ...rest, createdBy: context.user.id };
  EventSchema.validate(updated);
  await db.collection("events").updateOne({ _id: new ObjectId(eventId) }, { $set: updated });
  return { ...updated, _id: new ObjectId(eventId) };
};

const deleteEvent = async (_, { eventId }, context) => {
  if (!context.user) throw new Error("Unauthorized");

  const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) });
  if (!event || event.createdBy !== context.user.id) throw new Error("Forbidden");

  await db.collection("events").deleteOne({ _id: new ObjectId(eventId) });
  return true;
};

export default {
  Query: {
    events,
    myEvents,
  },
  Mutation: {
    createEvent,
    updateEvent,
    deleteEvent,
  },
};
