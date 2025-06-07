import { jest } from '@jest/globals';

describe('Configuration de base', () => {
  test('Jest fonctionne avec les modules ES6', () => {
    expect(1 + 1).toBe(2);
  });

  test('Les variables d\'environnement sont chargées depuis .env.test', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.DB_NAME).toBe('slopify-test');
    expect(process.env.MONGODB_URI).toBeDefined();
  });

  test('Jest peut utiliser les mocks', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  test('Les variables Spotify sont définies pour les tests', () => {
    expect(process.env.SPOTIFY_CLIENT_ID).toBeDefined();
    expect(process.env.SPOTIFY_CLIENT_SECRET).toBeDefined();
  });
});