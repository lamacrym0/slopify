import dotenv from 'dotenv';

// Mock console to avoid noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: originalConsole.error, // Keep error for debugging
};

// Charger les variables d'environnement pour les tests
dotenv.config({ path: '.env.test' });

// Global test utilities
global.createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  _id: 'test-user-id'
});

global.createMockEvent = () => ({
  _id: 'test-event-id',
  name: 'Test Event',
  dateFrom: '20250717',
  dateTo: '20250720',
  location: [46.2276, 7.3606],
  artists: [
    { id: 'artist1', name: 'Test Artist', href: null, imageUrl: null }
  ],
  createdBy: 'test-user-id'
});