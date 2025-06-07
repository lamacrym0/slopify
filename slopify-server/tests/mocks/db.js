import { jest } from '@jest/globals';

export const createMockDb = () => {
  const mockCollection = {
    insertOne: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
    insertMany: jest.fn()
  };

  const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection)
  };

  return { mockDb, mockCollection };
};

export const createMockContext = (user = null) => ({
  user: user || {
    id: 'test-user-id',
    email: 'test@example.com'
  }
});

export const createMockEvent = () => ({
  name: "Test Event",
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
});