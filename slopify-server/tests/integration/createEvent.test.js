import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createMockEvent } from '../mocks/db.js';

// Configuration de test
const TEST_JWT_SECRET = 'test-secret';
const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com'
};

// Mock des variables d'environnement
process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.DB_NAME = 'slopify-test';

// Mock de MongoDB
const mockEvents = [];
const mockUsers = [TEST_USER];

jest.unstable_mockModule('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => ({
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockImplementation((collectionName) => {
        if (collectionName === 'events') {
          return {
            insertOne: jest.fn().mockImplementation((event) => {
              const newEvent = { ...event, _id: 'new-event-id' };
              mockEvents.push(newEvent);
              return Promise.resolve({ insertedId: 'new-event-id' });
            }),
            find: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockEvents)
            }),
            findOne: jest.fn().mockImplementation((query) => {
              return Promise.resolve(mockEvents.find(e => e._id === query._id));
            }),
            countDocuments: jest.fn().mockResolvedValue(0)
          };
        }
        if (collectionName === 'users') {
          return {
            findOne: jest.fn().mockImplementation((query) => {
              return Promise.resolve(mockUsers.find(u => u.email === query.email));
            })
          };
        }
        return {};
      })
    }),
    connect: jest.fn().mockResolvedValue(true)
  }))
}));

// Mock d'autres dépendances
jest.unstable_mockModule('../../auth/passportConfig.js', () => ({}));
jest.unstable_mockModule('../../db/bootstrap.js', () => ({
  bootstrapEvents: jest.fn().mockResolvedValue()
}));

describe('createEvent - Tests d\'intégration', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    // Créer un token JWT valide pour les tests
    authToken = jwt.sign(TEST_USER, TEST_JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(async () => {
    // Nettoyer les événements mock
    mockEvents.length = 0;
    
    // Importer l'app après que les mocks soient en place
    const appModule = await import('../../index.js');
    app = appModule.default || appModule.app;
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
      const eventData = createMockEvent();
      
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
      expect(createdEvent._id).toBe('new-event-id');
      expect(createdEvent.name).toBe(eventData.name);
      expect(createdEvent.dateFrom).toBe(eventData.dateFrom);
      expect(createdEvent.dateTo).toBe(eventData.dateTo);
      expect(createdEvent.location).toEqual(eventData.location);
      expect(createdEvent.artists).toEqual(eventData.artists);
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

    test('devrait créer un événement avec plusieurs artistes', async () => {
      const eventData = {
        name: "Festival Multi-Artistes",
        dateFrom: "20250901",
        dateTo: "20250903",
        location: [46.5197, 6.6323],
        artists: [
          {
            id: "artist1",
            name: "Premier Artiste",
            href: "https://spotify.com/artist1",
            imageUrl: "https://example.com/artist1.jpg"
          },
          {
            id: "artist2",
            name: "Deuxième Artiste",
            href: null,
            imageUrl: null
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
      const createdEvent = response.body.data.createEvent;
      expect(createdEvent.artists).toHaveLength(2);
      expect(createdEvent.artists[0].name).toBe("Premier Artiste");
      expect(createdEvent.artists[1].name).toBe("Deuxième Artiste");
    });

    test('devrait rejeter la création sans authentification', async () => {
      const eventData = createMockEvent();
      
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
      const eventData = createMockEvent();
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

    test('devrait rejeter la création avec des données invalides', async () => {
      const invalidEventData = {
        name: "", // nom vide
        dateFrom: "invalid-date",
        dateTo: "20250720",
        location: [46.2276], // location incomplète
        artists: []
      };
      
      const response = await request(app)
        .post('/graphql')
        .set('Cookie', `token=${authToken}`)
        .send({
          query: CREATE_EVENT_MUTATION,
          variables: invalidEventData
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Persistance des données', () => {
    test('l\'événement créé devrait être persisté en base', async () => {
      const eventData = createMockEvent();
      
      // Créer l'événement
      await request(app)
        .post('/graphql')
        .set('Cookie', `token=${authToken}`)
        .send({
          query: CREATE_EVENT_MUTATION,
          variables: eventData
        });

      // Vérifier qu'il est bien sauvegardé
      expect(mockEvents).toHaveLength(1);
      expect(mockEvents[0].name).toBe(eventData.name);
      expect(mockEvents[0].createdBy).toBe(TEST_USER.id);
    });

    test('plusieurs événements peuvent être créés par le même utilisateur', async () => {
      const event1 = createMockEvent();
      const event2 = {
        ...createMockEvent(),
        name: "Deuxième événement"
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