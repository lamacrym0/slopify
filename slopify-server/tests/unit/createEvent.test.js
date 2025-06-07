import { jest } from '@jest/globals';
import { createMockDb, createMockContext, createMockEvent } from '../mocks/db.js';

// Mock des dépendances
jest.unstable_mockModule('../../db/client.js', () => ({
  db: null // sera remplacé dans chaque test
}));

jest.unstable_mockModule('../../models/EventSchema.js', () => ({
  EventSchema: {
    validate: jest.fn()
  }
}));

describe('createEvent - Tests Unitaires', () => {
  let createEventResolver;
  let mockDb;
  let mockCollection;
  let EventSchema;

  beforeEach(async () => {
    // Reset des mocks
    jest.clearAllMocks();
    
    // Création des mocks
    const dbMocks = createMockDb();
    mockDb = dbMocks.mockDb;
    mockCollection = dbMocks.mockCollection;

    // Mock du module db
    const dbModule = await import('../../db/client.js');
    dbModule.db = mockDb;

    // Import du EventSchema mocké
    const eventSchemaModule = await import('../../models/EventSchema.js');
    EventSchema = eventSchemaModule.EventSchema;

    // Import du resolver après que les mocks soient en place
    const resolversModule = await import('../../graphql/resolvers.js');
    createEventResolver = resolversModule.default.Mutation.createEvent;
  });

  describe('Vérifications de sécurité', () => {
    test('devrait lever une exception si aucun utilisateur n\'est connecté', async () => {
      const args = createMockEvent();
      const context = { user: null };

      await expect(createEventResolver(null, args, context))
        .rejects.toThrow('Unauthorized');
    });

    test('devrait lever une exception si le contexte ne contient pas de user', async () => {
      const args = createMockEvent();
      const context = {};

      await expect(createEventResolver(null, args, context))
        .rejects.toThrow('Unauthorized');
    });
  });

  describe('Interactions avec la base de données', () => {
    test('devrait appeler collection avec le paramètre "events"', async () => {
      const args = createMockEvent();
      const context = createMockContext();
      const insertResult = { insertedId: 'test-id' };

      mockCollection.insertOne.mockResolvedValue(insertResult);
      EventSchema.validate.mockImplementation(() => {}); // Ne fait rien

      await createEventResolver(null, args, context);

      expect(mockDb.collection).toHaveBeenCalledWith('events');
    });

    test('devrait appeler insertOne avec les bons paramètres', async () => {
      const args = createMockEvent();
      const context = createMockContext();
      const insertResult = { insertedId: 'test-id' };

      mockCollection.insertOne.mockResolvedValue(insertResult);
      EventSchema.validate.mockImplementation(() => {});

      await createEventResolver(null, args, context);

      // Vérifier que insertOne a été appelé
      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        ...args,
        createdBy: context.user.id
      });
    });

    test('devrait valider l\'événement avec EventSchema', async () => {
      const args = createMockEvent();
      const context = createMockContext();
      const insertResult = { insertedId: 'test-id' };

      mockCollection.insertOne.mockResolvedValue(insertResult);
      EventSchema.validate.mockImplementation(() => {});

      await createEventResolver(null, args, context);

      expect(EventSchema.validate).toHaveBeenCalledWith({
        ...args,
        createdBy: context.user.id
      });
    });
  });

  describe('Valeur de retour', () => {
    test('devrait retourner le nouvel événement avec son ID', async () => {
      const args = createMockEvent();
      const context = createMockContext();
      const insertResult = { insertedId: 'new-event-id' };

      mockCollection.insertOne.mockResolvedValue(insertResult);
      EventSchema.validate.mockImplementation(() => {});

      const result = await createEventResolver(null, args, context);

      expect(result).toEqual({
        ...args,
        createdBy: context.user.id,
        _id: 'new-event-id'
      });
    });

    test('devrait propager les erreurs de validation', async () => {
      const args = createMockEvent();
      const context = createMockContext();
      const validationError = new Error('Données invalides');

      EventSchema.validate.mockImplementation(() => {
        throw validationError;
      });

      await expect(createEventResolver(null, args, context))
        .rejects.toThrow('Données invalides');
    });

    test('devrait propager les erreurs de base de données', async () => {
      const args = createMockEvent();
      const context = createMockContext();
      const dbError = new Error('Erreur de base de données');

      EventSchema.validate.mockImplementation(() => {});
      mockCollection.insertOne.mockRejectedValue(dbError);

      await expect(createEventResolver(null, args, context))
        .rejects.toThrow('Erreur de base de données');
    });
  });

  describe('Structure des données', () => {
    test('devrait inclure createdBy dans l\'événement sauvegardé', async () => {
      const args = createMockEvent();
      const context = createMockContext();
      const insertResult = { insertedId: 'test-id' };

      mockCollection.insertOne.mockResolvedValue(insertResult);
      EventSchema.validate.mockImplementation(() => {});

      await createEventResolver(null, args, context);

      const savedEvent = mockCollection.insertOne.mock.calls[0][0];
      expect(savedEvent.createdBy).toBe(context.user.id);
    });

    test('devrait conserver tous les champs de l\'événement original', async () => {
      const args = createMockEvent();
      const context = createMockContext();
      const insertResult = { insertedId: 'test-id' };

      mockCollection.insertOne.mockResolvedValue(insertResult);
      EventSchema.validate.mockImplementation(() => {});

      await createEventResolver(null, args, context);

      const savedEvent = mockCollection.insertOne.mock.calls[0][0];
      
      expect(savedEvent.name).toBe(args.name);
      expect(savedEvent.dateFrom).toBe(args.dateFrom);
      expect(savedEvent.dateTo).toBe(args.dateTo);
      expect(savedEvent.location).toEqual(args.location);
      expect(savedEvent.artists).toEqual(args.artists);
    });
  });
});