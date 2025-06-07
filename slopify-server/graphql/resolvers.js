import { db } from "../db/client.js";
import { ObjectId } from "mongodb";
import { EventSchema } from "../models/EventSchema.js";
import axios from "axios";

// Fonction pour obtenir un token Spotify
let spotifyToken = null;
let tokenExpiry = null;

async function getSpotifyToken() {
  if (spotifyToken && tokenExpiry && Date.now() < tokenExpiry) {
    return spotifyToken;
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      'grant_type=client_credentials', 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );

    spotifyToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute de marge

    return spotifyToken;
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token Spotify:', error);
    throw new Error('Impossible d\'accéder à l\'API Spotify');
  }
}

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
  console.log("ARGS REÇUS ➜", args); 
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

const searchArtist = async (_, { name }) => {
  try {
    const token = await getSpotifyToken();
    
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        q: name,
        type: 'artist',
        limit: 10
      }
    });

    return response.data.artists.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      href: artist.external_urls.spotify,
      imageUrl: artist.images.length > 0 ? artist.images[0].url : null
    }));
  } catch (error) {
    console.error('Erreur lors de la recherche Spotify:', error);
    throw new Error('Erreur lors de la recherche d\'artistes');
  }
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
    searchArtist,
  },
  // Resolver pour s'assurer que le champ id est toujours présent
  Artist: {
    id: (parent) => parent.id || parent.name || 'unknown',
    name: (parent) => parent.name || 'Artiste inconnu',
    href: (parent) => parent.href || null,
    imageUrl: (parent) => parent.imageUrl || null,
  }
};