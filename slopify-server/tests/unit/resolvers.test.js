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

jest.unstable_mockModule('mongodb', () => ({
  ObjectId: jest.fn().mockImplementation((id) => id)
}));

describe('Resolvers - Tests Unitaires', () => {
  let resolvers;
  let mockDb;
  let mockCollection;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const dbMocks = createMockDb();
    mockDb = dbMocks.mockDb;
    mockCollection = dbMocks.mockCollection;

    const dbModule = await import('../../db/client.js');
    dbModule.db = mockDb;

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
      const context = createMockContext();
      const mockEvents = [createMockEvent(), createMockEvent()];
      
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockEvents)
      });

      const result = await resolvers.Query.events(null, {}, context);

      expect(mockDb.collection).toHaveBeenCalledWith('events');
      expect(mockCollection.find).toHaveBeenCalledWith();
      expect(result).toEqual(mockEvents);
    });
  });

  describe('Query: myEvents', () => {
    test('devrait rejeter si aucun utilisateur n\'est connecté', async () => {
      const context = { user: null };

      await expect(resolvers.Query.myEvents(null, {}, context))
        .rejects.toThrow('Unauthorized');
    });

    test('devrait retourner seulement les événements créés par l\'utilisateur', async () => {
      const context = createMockContext();
      const userEvents = [
        { ...createMockEvent(), createdBy: context.user.id },
        { ...createMockEvent(), createdBy: context.user.id }
      ];
      
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(userEvents)
      });

      const result = await resolvers.Query.myEvents(null, {}, context);

      expect(mockDb.collection).toHaveBeenCalledWith('events');
      expect(mockCollection.find).toHaveBeenCalledWith({ createdBy: context.user.id });
      expect(result).toEqual(userEvents);
    });
  });

  describe('Mutation: updateEvent', () => {
    test('devrait rejeter si aucun utilisateur n\'est connecté', async () => {
      const args = { eventId: 'test-id', ...createMockEvent() };
      const context = { user: null };

      await expect(resolvers.Mutation.updateEvent(null, args, context))
        .rejects.toThrow('Unauthorized');
    });

    test('devrait rejeter si l\'événement n\'existe pas', async () => {
      const args = { eventId: 'non-existent-id', ...createMockEvent() };
      const context = createMockContext();
      
      mockCollection.findOne.mockResolvedValue(null);

      await expect(resolvers.Mutation.updateEvent(null, args, context))
        .rejects.toThrow('Forbidden');
    });

    test('devrait rejeter si l\'utilisateur n\'est pas le créateur', async () => {
      const args = { eventId: 'test-id', ...createMockEvent() };
      const context = createMockContext();
      const existingEvent = { ...createMockEvent(), createdBy: 'another-user-id' };
      
      mockCollection.findOne.mockResolvedValue(existingEvent);

      await expect(resolvers.Mutation.updateEvent(null, args, context))
        .rejects.toThrow('Forbidden');
    });

    test('devrait mettre à jour l\'événement avec succès', async () => {
      const args = { eventId: 'test-id', ...createMockEvent() };
      const context = createMockContext();
      const existingEvent = { ...createMockEvent(), createdBy: context.user.id };
      
      mockCollection.findOne.mockResolvedValue(existingEvent);
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await resolvers.Mutation.updateEvent(null, args, context);

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 'test-id' });
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: 'test-id' },
        { $set: { ...args, createdBy: context.user.id, eventId: undefined } }
      );
      expect(result).toEqual({
        ...args,
        _id: 'test-id',
        createdBy: context.user.id,
        eventId: undefined
      });
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
      const context = createMockContext();
      
      mockCollection.findOne.mockResolvedValue(null);

      await expect(resolvers.Mutation.deleteEvent(null, args, context))
        .rejects.toThrow('Forbidden');
    });

    test('devrait rejeter si l\'utilisateur n\'est pas le créateur', async () => {
      const args = { eventId: 'test-id' };
      const context = createMockContext();
      const existingEvent = { ...createMockEvent(), createdBy: 'another-user-id' };
      
      mockCollection.findOne.mockResolvedValue(existingEvent);

      await expect(resolvers.Mutation.deleteEvent(null, args, context))
        .rejects.toThrow('Forbidden');
    });

    test('devrait supprimer l\'événement avec succès', async () => {
      const args = { eventId: 'test-id' };
      const context = createMockContext();
      const existingEvent = { ...createMockEvent(), createdBy: context.user.id };
      
      mockCollection.findOne.mockResolvedValue(existingEvent);
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await resolvers.Mutation.deleteEvent(null, args, context);

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 'test-id' });
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: 'test-id' });
      expect(result).toBe(true);
    });
  });
});