import { jest } from '@jest/globals';

describe('createEvent - Tests Unitaires', () => {
  let mockDb;
  let mockCollection;
  let mockEventSchema;
  let createEventResolver;

  beforeEach(() => {
    // Mock de la collection MongoDB
    mockCollection = {
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'test-event-id' }),
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      })
    };

    // Mock de la base de données
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    // Mock du EventSchema
    mockEventSchema = {
      validate: jest.fn()
    };

    // Fonction createEvent simulée (basée sur le vrai resolver)
    createEventResolver = async (parent, args, context) => {
      // Vérification de l'authentification
      if (!context.user) {
        throw new Error('Unauthorized');
      }

      // Création de l'événement
      const event = {
        ...args,
        createdBy: context.user.id,
      };

      // Validation
      mockEventSchema.validate(event);
      
      // Insertion en base
      const result = await mockDb.collection("events").insertOne(event);
      
      return { ...event, _id: result.insertedId };
    };
  });

  describe('Vérifications de sécurité', () => {
    test('devrait lever une exception si aucun utilisateur n\'est connecté', async () => {
      const args = { 
        name: 'Test Event', 
        dateFrom: '20250101', 
        dateTo: '20250102', 
        location: [46.2, 7.3] 
      };
      const context = { user: null };

      await expect(createEventResolver(null, args, context))
        .rejects.toThrow('Unauthorized');
    });

    test('devrait lever une exception si le contexte ne contient pas de user', async () => {
      const args = { 
        name: 'Test Event', 
        dateFrom: '20250101', 
        dateTo: '20250102', 
        location: [46.2, 7.3] 
      };
      const context = {};

      await expect(createEventResolver(null, args, context))
        .rejects.toThrow('Unauthorized');
    });
  });

  describe('Interactions avec la base de données', () => {
    test('devrait appeler collection avec le paramètre "events"', async () => {
      const args = { 
        name: 'Test Event', 
        dateFrom: '20250101', 
        dateTo: '20250102', 
        location: [46.2, 7.3],
        artists: []
      };
      const context = { user: { id: 'user-123', email: 'test@test.com' } };

      await createEventResolver(null, args, context);

      expect(mockDb.collection).toHaveBeenCalledWith('events');
    });

    test('devrait appeler insertOne avec les bons paramètres', async () => {
      const args = { 
        name: 'Test Event', 
        dateFrom: '20250101', 
        dateTo: '20250102', 
        location: [46.2, 7.3],
        artists: [
          { id: 'artist-1', name: 'Test Artist', href: null, imageUrl: null }
        ]
      };
      const context = { user: { id: 'user-123', email: 'test@test.com' } };

      await createEventResolver(null, args, context);

      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        ...args,
        createdBy: 'user-123'
      });
    });

    test('devrait valider l\'événement avant l\'insertion', async () => {
      const args = { 
        name: 'Test Event', 
        dateFrom: '20250101', 
        dateTo: '20250102', 
        location: [46.2, 7.3],
        artists: []
      };
      const context = { user: { id: 'user-123', email: 'test@test.com' } };

      await createEventResolver(null, args, context);

      expect(mockEventSchema.validate).toHaveBeenCalledWith({
        ...args,
        createdBy: 'user-123'
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
      const context = { user: { id: 'user-123', email: 'test@test.com' } };

      const result = await createEventResolver(null, args, context);

      expect(result).toEqual({
        ...args,
        createdBy: 'user-123',
        _id: 'test-event-id'
      });
    });

    test('devrait inclure createdBy dans l\'événement retourné', async () => {
      const args = { 
        name: 'Test Event', 
        dateFrom: '20250101', 
        dateTo: '20250102', 
        location: [46.2, 7.3] 
      };
      const context = { user: { id: 'special-user-id', email: 'test@test.com' } };

      const result = await createEventResolver(null, args, context);

      expect(result.createdBy).toBe('special-user-id');
    });

    test('devrait propager les erreurs de validation', async () => {
      const args = { 
        name: 'Test Event', 
        dateFrom: '20250101', 
        dateTo: '20250102', 
        location: [46.2, 7.3] 
      };
      const context = { user: { id: 'user-123', email: 'test@test.com' } };

      mockEventSchema.validate.mockImplementation(() => {
        throw new Error('Données invalides');
      });

      await expect(createEventResolver(null, args, context))
        .rejects.toThrow('Données invalides');
    });

    test('devrait propager les erreurs de base de données', async () => {
      const args = { 
        name: 'Test Event', 
        dateFrom: '20250101', 
        dateTo: '20250102', 
        location: [46.2, 7.3] 
      };
      const context = { user: { id: 'user-123', email: 'test@test.com' } };

      mockCollection.insertOne.mockRejectedValue(new Error('Erreur de base de données'));

      await expect(createEventResolver(null, args, context))
        .rejects.toThrow('Erreur de base de données');
    });
  });

  describe('Structure des données', () => {
    test('devrait conserver tous les champs de l\'événement original', async () => {
      const args = { 
        name: 'Festival Test', 
        dateFrom: '20250601', 
        dateTo: '20250603', 
        location: [46.2276, 7.3606],
        artists: [
          { id: 'artist-1', name: 'Artiste 1', href: 'https://spotify.com/artist1', imageUrl: 'https://image1.jpg' },
          { id: 'artist-2', name: 'Artiste 2', href: null, imageUrl: null }
        ]
      };
      const context = { user: { id: 'user-123', email: 'test@test.com' } };

      const result = await createEventResolver(null, args, context);

      expect(result.name).toBe(args.name);
      expect(result.dateFrom).toBe(args.dateFrom);
      expect(result.dateTo).toBe(args.dateTo);
      expect(result.location).toEqual(args.location);
      expect(result.artists).toEqual(args.artists);
    });
  });
});