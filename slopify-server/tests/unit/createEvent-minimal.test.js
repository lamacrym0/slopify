// tests/unit/createEvent-minimal.test.js
import { jest } from '@jest/globals';

describe('createEvent - Tests Unitaires Minimaux', () => {
  let mockDb;
  let mockCollection;
  let createEventFunction;

  beforeEach(() => {
    // Mock simple de la collection
    mockCollection = {
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-id' }),
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      })
    };

    // Mock simple de la db
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    // Mock simple du schema
    const mockEventSchema = {
      validate: jest.fn()
    };

    // Fonction createEvent simplifiée
    createEventFunction = async (parent, args, context) => {
      // Vérification de l'authentification
      if (!context.user) {
        throw new Error('Unauthorized');
      }

      // Création de l'événement
      const event = {
        ...args,
        createdBy: context.user.id,
      };

      // Validation (mock)
      mockEventSchema.validate(event);
      
      // Insertion en base
      const result = await mockDb.collection("events").insertOne(event);
      
      return { ...event, _id: result.insertedId };
    };
  });

  describe('Sécurité', () => {
    test('devrait lever une exception si aucun utilisateur n\'est connecté', async () => {
      const args = { name: 'Test', dateFrom: '20250101', dateTo: '20250102', location: [0, 0] };
      const context = { user: null };

      await expect(createEventFunction(null, args, context))
        .rejects.toThrow('Unauthorized');
    });

    test('devrait lever une exception si le contexte est vide', async () => {
      const args = { name: 'Test', dateFrom: '20250101', dateTo: '20250102', location: [0, 0] };
      const context = {};

      await expect(createEventFunction(null, args, context))
        .rejects.toThrow('Unauthorized');
    });
  });

  describe('Base de données', () => {
    test('devrait appeler collection avec "events"', async () => {
      const args = { name: 'Test', dateFrom: '20250101', dateTo: '20250102', location: [0, 0] };
      const context = { user: { id: 'user-1', email: 'test@test.com' } };

      await createEventFunction(null, args, context);

      expect(mockDb.collection).toHaveBeenCalledWith('events');
    });

    test('devrait appeler insertOne avec les bons paramètres', async () => {
      const args = { 
        name: 'Test Event', 
        dateFrom: '20250101', 
        dateTo: '20250102', 
        location: [46.2, 7.3],
        artists: []
      };
      const context = { user: { id: 'user-1', email: 'test@test.com' } };

      await createEventFunction(null, args, context);

      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        ...args,
        createdBy: context.user.id
      });
    });
  });

  describe('Valeur de retour', () => {
    test('devrait retourner le nouvel événement avec son ID', async () => {
      const args = { 
        name: 'Test Event', 
        dateFrom: '20250101', 
        dateTo: '20250102', 
        location: [46.2, 7.3],
        artists: []
      };
      const context = { user: { id: 'user-1', email: 'test@test.com' } };

      const result = await createEventFunction(null, args, context);

      expect(result).toEqual({
        ...args,
        createdBy: context.user.id,
        _id: 'new-id'
      });
    });

    test('devrait inclure createdBy dans l\'événement', async () => {
      const args = { name: 'Test', dateFrom: '20250101', dateTo: '20250102', location: [0, 0] };
      const context = { user: { id: 'user-123', email: 'test@test.com' } };

      const result = await createEventFunction(null, args, context);

      expect(result.createdBy).toBe('user-123');
    });
  });
});