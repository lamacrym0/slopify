import { jest } from '@jest/globals';

// Configuration des mocks
const mockEvents = [];
const mockCollection = {
  insertOne: jest.fn().mockImplementation((event) => {
    const newEvent = { ...event, _id: 'new-event-id' };
    mockEvents.push(newEvent);
    return Promise.resolve({ insertedId: 'new-event-id' });
  }),
  find: jest.fn().mockImplementation((query = {}) => ({
    toArray: jest.fn().mockResolvedValue(
      query.createdBy ? mockEvents.filter(e => e.createdBy === query.createdBy) : mockEvents
    )
  })),
  findOne: jest.fn().mockImplementation((query) => {
    return Promise.resolve(mockEvents.find(e => e._id === query._id));
  }),
  updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 })
};

const mockDb = {
  collection: jest.fn().mockReturnValue(mockCollection)
};

// Mock du module db/client avant les imports
jest.unstable_mockModule('../../db/client.js', () => ({
  db: mockDb,
  client: { connect: jest.fn() }
}));

// Mock du module EventSchema
jest.unstable_mockModule('../../models/EventSchema.js', () => ({
  EventSchema: {
    validate: jest.fn()
  }
}));

// Mock de MongoDB ObjectId
jest.unstable_mockModule('mongodb', () => ({
  ObjectId: jest.fn().mockImplementation((id) => id || 'mocked-object-id')
}));

// Mock d'axios pour éviter les appels Spotify
jest.unstable_mockModule('axios', () => ({
  default: {
    post: jest.fn().mockResolvedValue({
      data: { access_token: 'mock-token', expires_in: 3600 }
    }),
    get: jest.fn().mockResolvedValue({
      data: { artists: { items: [] } }
    })
  }
}));

describe('Resolvers - Tests Unitaires', () => {
  let resolvers;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockEvents.length = 0; // Vider le tableau des événements

    // Import des resolvers après que les mocks soient en place
    const resolversModule = await import('../../graphql/resolvers.js');
    resolvers = resolversModule.default;
  });

  describe('Query: events', () => {
    test('devrait rejeter si aucun utilisateur n\'est connecté', async () => {
      const context = { user: null };

      await expect(resolvers.Query.events(null, {}, context))
        .rejects.toThrow('Unauthorized');
    });

    test('devrait retourner tous les événements pour un utilisateur connecté', async () => {
      const context = { user: { id: 'test-user', email: 'test@test.com' } };
      
      // Ajouter quelques événements mock
      mockEvents.push(
        { _id: '1', name: 'Event 1', createdBy: 'test-user' },
        { _id: '2', name: 'Event 2', createdBy: 'other-user' }
      );

      const result = await resolvers.Query.events(null, {}, context);

      expect(mockDb.collection).toHaveBeenCalledWith('events');
      expect(mockCollection.find).toHaveBeenCalledWith();
      expect(result).toHaveLength(2);
    });
  });

  describe('Query: myEvents', () => {
    test('devrait rejeter si aucun utilisateur n\'est connecté', async () => {
      const context = { user: null };

      await expect(resolvers.Query.myEvents(null, {}, context))
        .rejects.toThrow('Unauthorized');
    });

    test('devrait retourner seulement les événements créés par l\'utilisateur', async () => {
      const context = { user: { id: 'test-user', email: 'test@test.com' } };
      
      // Ajouter des événements mock
      mockEvents.push(
        { _id: '1', name: 'My Event 1', createdBy: 'test-user' },
        { _id: '2', name: 'Other Event', createdBy: 'other-user' },
        { _id: '3', name: 'My Event 2', createdBy: 'test-user' }
      );

      const result = await resolvers.Query.myEvents(null, {}, context);

      expect(mockDb.collection).toHaveBeenCalledWith('events');
      expect(mockCollection.find).toHaveBeenCalledWith({ createdBy: 'test-user' });
      expect(result).toHaveLength(2);
      expect(result.every(event => event.createdBy === 'test-user')).toBe(true);
    });
  });

  describe('Mutation: createEvent', () => {
    test('devrait créer un événement avec succès', async () => {
      const args = {
        name: 'Test Event',
        dateFrom: '20250101',
        dateTo: '20250102',
        location: [46.2, 7.3],
        artists: []
      };
      const context = { user: { id: 'test-user', email: 'test@test.com' } };

      const result = await resolvers.Mutation.createEvent(null, args, context);

      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        ...args,
        createdBy: 'test-user'
      });
      expect(result).toEqual({
        ...args,
        createdBy: 'test-user',
        _id: 'new-event-id'
      });
    });
  });

  describe('Mutation: updateEvent', () => {
    test('devrait rejeter si aucun utilisateur n\'est connecté', async () => {
      const args = { eventId: 'test-id', name: 'Updated Event' };
      const context = { user: null };

      await expect(resolvers.Mutation.updateEvent(null, args, context))
        .rejects.toThrow('Unauthorized');
    });

    test('devrait rejeter si l\'événement n\'existe pas', async () => {
      const args = { eventId: 'non-existent-id', name: 'Updated Event' };
      const context = { user: { id: 'test-user', email: 'test@test.com' } };
      
      mockCollection.findOne.mockResolvedValueOnce(null);

      await expect(resolvers.Mutation.updateEvent(null, args, context))
        .rejects.toThrow('Forbidden');
    });

    test('devrait rejeter si l\'utilisateur n\'est pas le créateur', async () => {
      const args = { eventId: 'test-id', name: 'Updated Event' };
      const context = { user: { id: 'test-user', email: 'test@test.com' } };
      const existingEvent = { _id: 'test-id', name: 'Original Event', createdBy: 'other-user' };
      
      mockCollection.findOne.mockResolvedValueOnce(existingEvent);

      await expect(resolvers.Mutation.updateEvent(null, args, context))
        .rejects.toThrow('Forbidden');
    });

    test('devrait mettre à jour l\'événement avec succès', async () => {
      const args = { 
        eventId: 'test-id', 
        name: 'Updated Event',
        dateFrom: '20250101',
        dateTo: '20250102',
        location: [46.2, 7.3],
        artists: []
      };
      const context = { user: { id: 'test-user', email: 'test@test.com' } };
      const existingEvent = { _id: 'test-id', name: 'Original Event', createdBy: 'test-user' };
      
      mockCollection.findOne.mockResolvedValueOnce(existingEvent);

      const result = await resolvers.Mutation.updateEvent(null, args, context);

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 'test-id' });
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: 'test-id' },
        { $set: expect.objectContaining({ name: 'Updated Event', createdBy: 'test-user' }) }
      );
      expect(result._id).toBe('test-id');
      expect(result.name).toBe('Updated Event');
    });
  });

  describe('Mutation: deleteEvent', () => {
    test('devrait rejeter si aucun utilisateur n\'est connecté', async () => {
      const args = { eventId: 'test-id' };
      const context = { user: null };

      await expect(resolvers.Mutation.deleteEvent(null, args, context))
        .rejects.toThrow('Unauthorized');
    });

    test('devrait rejeter si l\'événement n\'existe pas', async () => {
      const args = { eventId: 'non-existent-id' };
      const context = { user: { id: 'test-user', email: 'test@test.com' } };
      
      mockCollection.findOne.mockResolvedValueOnce(null);

      await expect(resolvers.Mutation.deleteEvent(null, args, context))
        .rejects.toThrow('Forbidden');
    });

    test('devrait rejeter si l\'utilisateur n\'est pas le créateur', async () => {
      const args = { eventId: 'test-id' };
      const context = { user: { id: 'test-user', email: 'test@test.com' } };
      const existingEvent = { _id: 'test-id', name: 'Test Event', createdBy: 'other-user' };
      
      mockCollection.findOne.mockResolvedValueOnce(existingEvent);

      await expect(resolvers.Mutation.deleteEvent(null, args, context))
        .rejects.toThrow('Forbidden');
    });

    test('devrait supprimer l\'événement avec succès', async () => {
      const args = { eventId: 'test-id' };
      const context = { user: { id: 'test-user', email: 'test@test.com' } };
      const existingEvent = { _id: 'test-id', name: 'Test Event', createdBy: 'test-user' };
      
      mockCollection.findOne.mockResolvedValueOnce(existingEvent);

      const result = await resolvers.Mutation.deleteEvent(null, args, context);

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 'test-id' });
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: 'test-id' });
      expect(result).toBe(true);
    });
  });

  describe('Mutation: searchArtist', () => {
    test('devrait rechercher des artistes via Spotify', async () => {
      const args = { name: 'test artist' };

      // Mock de la réponse Spotify
      const mockAxios = (await import('axios')).default;
      mockAxios.get.mockResolvedValueOnce({
        data: {
          artists: {
            items: [
              {
                id: 'artist1',
                name: 'Test Artist',
                external_urls: { spotify: 'https://open.spotify.com/artist/artist1' },
                images: [{ url: 'https://image.jpg' }]
              }
            ]
          }
        }
      });

      const result = await resolvers.Mutation.searchArtist(null, args);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'artist1',
        name: 'Test Artist',
        href: 'https://open.spotify.com/artist/artist1',
        imageUrl: 'https://image.jpg'
      });
    });
  });

  describe('Resolver: Artist', () => {
    test('devrait fournir des valeurs par défaut pour les champs manquants', () => {
      const artistWithoutId = { name: 'Test Artist' };
      const artistEmpty = {};

      expect(resolvers.Artist.id(artistWithoutId)).toBe('Test Artist');
      expect(resolvers.Artist.id(artistEmpty)).toBe('unknown');
      expect(resolvers.Artist.name(artistEmpty)).toBe('Artiste inconnu');
      expect(resolvers.Artist.href(artistEmpty)).toBe(null);
      expect(resolvers.Artist.imageUrl(artistEmpty)).toBe(null);
    });
  });
});