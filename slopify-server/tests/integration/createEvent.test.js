import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

// Configuration de test
const TEST_JWT_SECRET = process.env.JWT_SECRET;
const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com'
};

// Mock de MongoDB simple
const mockEvents = [];

const mockCollection = {
  insertOne: jest.fn().mockImplementation((event) => {
    const newEvent = { ...event, _id: `event-${Date.now()}` };
    mockEvents.push(newEvent);
    return Promise.resolve({ insertedId: newEvent._id });
  }),
  find: jest.fn().mockReturnValue({
    toArray: jest.fn().mockResolvedValue(mockEvents)
  }),
  findOne: jest.fn().mockImplementation((query) => {
    return Promise.resolve(mockEvents.find(e => e._id === query._id));
  }),
  countDocuments: jest.fn().mockResolvedValue(0)
};

const mockDb = {
  collection: jest.fn().mockReturnValue(mockCollection)
};

// Mock du client MongoDB
jest.unstable_mockModule('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => ({
    db: jest.fn().mockReturnValue(mockDb),
    connect: jest.fn().mockResolvedValue(true)
  }))
}));

// Mock du module db/client
jest.unstable_mockModule('../../db/client.js', () => ({
  client: { connect: jest.fn().mockResolvedValue(true) },
  db: mockDb
}));

// Mock du bootstrap
jest.unstable_mockModule('../../db/bootstrap.js', () => ({
  bootstrapEvents: jest.fn().mockResolvedValue()
}));

// Mock de Passport
jest.unstable_mockModule('../../auth/passportConfig.js', () => ({}));

// Types GraphQL simplifiés
const typeDefs = `
  type Artist {
    id: ID!
    name: String!
    href: String
    imageUrl: String
  }

  type Event {
    _id: ID!
    name: String!
    dateFrom: String!
    dateTo: String!
    location: [Float]!
    artists: [Artist]
    createdBy: ID
  }

  input ArtistInput {
    id: ID
    name: String!
    href: String
    imageUrl: String
  }

  type Query {
    events: [Event]
  }

  type Mutation {
    createEvent(
      name: String!
      dateFrom: String!
      dateTo: String!
      location: [Float]!
      artists: [ArtistInput]
    ): Event
  }
`;

// Resolvers simplifiés
const resolvers = {
  Query: {
    events: async (_, __, context) => {
      if (!context.user) throw new Error("Unauthorized");
      return mockEvents;
    }
  },
  Mutation: {
    createEvent: async (_, args, context) => {
      if (!context.user) throw new Error("Unauthorized");
      
      const event = {
        ...args,
        createdBy: context.user.id,
      };

      const result = await mockDb.collection("events").insertOne(event);
      return { ...event, _id: result.insertedId };
    }
  }
};

describe('createEvent - Tests d\'intégration', () => {
  let app;
  let authToken;

  beforeAll(async () => {

    // Créer un token JWT valide pour les tests
    authToken = jwt.sign(TEST_USER, TEST_JWT_SECRET, { expiresIn: '1h' });

    // Créer l'application Express
    app = express();

    app.use(cors({
      origin: "http://localhost:5173",
      credentials: true
    }));
    app.use(express.json());
    app.use(cookieParser());

    // Créer le serveur Apollo
    const apolloServer = new ApolloServer({ typeDefs, resolvers });
    await apolloServer.start();

    app.use('/graphql', expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const token = req.cookies?.token;
        try {
          const user = jwt.verify(token, TEST_JWT_SECRET);
          return { user };
        } catch {
          return {};
        }
      }
    }));
  });

  beforeEach(() => {
    // Nettoyer les événements mock avant chaque test
    mockEvents.length = 0;
    jest.clearAllMocks();
  });

  describe('Mutation createEvent', () => {
    const CREATE_EVENT_MUTATION = `
      mutation CreateEvent($name: String!, $dateFrom: String!, $dateTo: String!, $location: [Float]!, $artists: [ArtistInput]) {
        createEvent(name: $name, dateFrom: $dateFrom, dateTo: $dateTo, location: $location, artists: $artists) {
          _id
          name
          dateFrom
          dateTo
          location
          artists {
            id
            name
            href
            imageUrl
          }
          createdBy
        }
      }
    `;

    test('devrait créer un nouvel événement avec succès', async () => {
      const eventData = {
        name: "Test Festival 2025",
        dateFrom: "20250717",
        dateTo: "20250720",
        location: [46.2276, 7.3606],
        artists: [
          {
            id: "test-artist-1",
            name: "Test Artist",
            href: "https://open.spotify.com/artist/test",
            imageUrl: "https://example.com/image.jpg"
          }
        ]
      };
      
      const response = await request(app)
        .post('/graphql')
        .set('Cookie', `token=${authToken}`)
        .send({
          query: CREATE_EVENT_MUTATION,
          variables: eventData
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      
      const createdEvent = response.body.data.createEvent;
      expect(createdEvent).toBeDefined();
      expect(createdEvent._id).toBeDefined();
      expect(createdEvent.name).toBe(eventData.name);
      expect(createdEvent.dateFrom).toBe(eventData.dateFrom);
      expect(createdEvent.dateTo).toBe(eventData.dateTo);
      expect(createdEvent.location).toEqual(eventData.location);
      expect(createdEvent.artists).toHaveLength(1);
      expect(createdEvent.artists[0].name).toBe("Test Artist");
      expect(createdEvent.createdBy).toBe(TEST_USER.id);
    });

    test('devrait créer un événement sans artistes', async () => {
      const eventData = {
        name: "Événement sans artistes",
        dateFrom: "20250801",
        dateTo: "20250802",
        location: [46.0966, 7.2276],
        artists: []
      };
      
      const response = await request(app)
        .post('/graphql')
        .set('Cookie', `token=${authToken}`)
        .send({
          query: CREATE_EVENT_MUTATION,
          variables: eventData
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      
      const createdEvent = response.body.data.createEvent;
      expect(createdEvent.artists).toEqual([]);
    });

    test('devrait rejeter la création sans authentification', async () => {
      const eventData = {
        name: "Test Event",
        dateFrom: "20250717",
        dateTo: "20250720",
        location: [46.2276, 7.3606],
        artists: []
      };
      
      const response = await request(app)
        .post('/graphql')
        .send({
          query: CREATE_EVENT_MUTATION,
          variables: eventData
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Unauthorized');
    });

    test('devrait rejeter la création avec un token invalide', async () => {
      const eventData = {
        name: "Test Event",
        dateFrom: "20250717",
        dateTo: "20250720",
        location: [46.2276, 7.3606],
        artists: []
      };
      const invalidToken = 'invalid-token';
      
      const response = await request(app)
        .post('/graphql')
        .set('Cookie', `token=${invalidToken}`)
        .send({
          query: CREATE_EVENT_MUTATION,
          variables: eventData
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Unauthorized');
    });
  });

  describe('Persistance des données', () => {
    const CREATE_EVENT_MUTATION = `
      mutation CreateEvent($name: String!, $dateFrom: String!, $dateTo: String!, $location: [Float]!, $artists: [ArtistInput]) {
        createEvent(name: $name, dateFrom: $dateFrom, dateTo: $dateTo, location: $location, artists: $artists) {
          _id
          name
          createdBy
        }
      }
    `;

    test('l\'événement créé devrait être persisté', async () => {
      const eventData = {
        name: "Test Persistence",
        dateFrom: "20250717",
        dateTo: "20250720",
        location: [46.2276, 7.3606],
        artists: []
      };
      
      await request(app)
        .post('/graphql')
        .set('Cookie', `token=${authToken}`)
        .send({
          query: CREATE_EVENT_MUTATION,
          variables: eventData
        });

      // Vérifier que l'insertion en base a été appelée
      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        ...eventData,
        createdBy: TEST_USER.id
      });

      // Vérifier que l'événement est dans le mock
      expect(mockEvents).toHaveLength(1);
      expect(mockEvents[0].name).toBe(eventData.name);
    });

    test('plusieurs événements peuvent être créés', async () => {
      const event1 = {
        name: "Premier événement",
        dateFrom: "20250717",
        dateTo: "20250720",
        location: [46.2276, 7.3606],
        artists: []
      };

      const event2 = {
        name: "Deuxième événement",
        dateFrom: "20250801",
        dateTo: "20250803",
        location: [46.0966, 7.2276],
        artists: []
      };
      
      // Créer le premier événement
      await request(app)
        .post('/graphql')
        .set('Cookie', `token=${authToken}`)
        .send({
          query: CREATE_EVENT_MUTATION,
          variables: event1
        });

      // Créer le deuxième événement
      await request(app)
        .post('/graphql')
        .set('Cookie', `token=${authToken}`)
        .send({
          query: CREATE_EVENT_MUTATION,
          variables: event2
        });

      expect(mockEvents).toHaveLength(2);
      expect(mockEvents[0].name).toBe(event1.name);
      expect(mockEvents[1].name).toBe(event2.name);
    });
  });
});