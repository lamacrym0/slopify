import { jest } from '@jest/globals';

// Mock axios
const mockAxios = {
  post: jest.fn(),
  get: jest.fn()
};

jest.unstable_mockModule('axios', () => ({
  default: mockAxios
}));

describe('SpotifyService - Tests Unitaires', () => {
  let SpotifyService;
  let consoleErrorSpy;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock console.error pour éviter l'affichage des erreurs attendues
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock des variables d'environnement
    process.env.SPOTIFY_CLIENT_ID = 'test-client-id';
    process.env.SPOTIFY_CLIENT_SECRET = 'test-client-secret';

    // Import du service après les mocks
    const spotifyModule = await import('../../services/spotifyService.js');
    SpotifyService = spotifyModule.default;
    
    // Reset du service pour chaque test
    SpotifyService.accessToken = null;
    SpotifyService.tokenExpiry = null;
  });

  afterEach(() => {
    // Restaurer console.error après chaque test
    consoleErrorSpy.mockRestore();
  });

  describe('getAccessToken', () => {
    test('devrait obtenir un nouveau token si aucun token existe', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'test-access-token',
          expires_in: 3600
        }
      };

      mockAxios.post.mockResolvedValue(mockTokenResponse);

      const token = await SpotifyService.getAccessToken();

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from('test-client-id:test-client-secret').toString('base64')}`
          }
        }
      );

      expect(token).toBe('test-access-token');
      expect(SpotifyService.accessToken).toBe('test-access-token');
    });

    test('devrait retourner le token existant s\'il est encore valide', async () => {
      // Simuler un token existant valide
      SpotifyService.accessToken = 'existing-token';
      SpotifyService.tokenExpiry = Date.now() + 1800000; // 30 minutes dans le futur

      const token = await SpotifyService.getAccessToken();

      expect(mockAxios.post).not.toHaveBeenCalled();
      expect(token).toBe('existing-token');
    });

    test('devrait obtenir un nouveau token si le token existant a expiré', async () => {
      // Simuler un token expiré
      SpotifyService.accessToken = 'expired-token';
      SpotifyService.tokenExpiry = Date.now() - 1000; // 1 seconde dans le passé

      const mockTokenResponse = {
        data: {
          access_token: 'new-access-token',
          expires_in: 3600
        }
      };

      mockAxios.post.mockResolvedValue(mockTokenResponse);

      const token = await SpotifyService.getAccessToken();

      expect(mockAxios.post).toHaveBeenCalled();
      expect(token).toBe('new-access-token');
    });

    test('devrait lever une erreur en cas d\'échec de l\'authentification', async () => {
      const errorResponse = {
        response: {
          data: { error: 'invalid_client' }
        }
      };

      mockAxios.post.mockRejectedValue(errorResponse);

      await expect(SpotifyService.getAccessToken())
        .rejects.toThrow('Impossible de s\'authentifier avec Spotify');
      
      // Vérifier que console.error a été appelé
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erreur lors de l\'authentification Spotify:', 
        { error: 'invalid_client' }
      );
    });
  });

  describe('searchArtists', () => {
    test('devrait rechercher des artistes avec succès', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'test-token',
          expires_in: 3600
        }
      };

      const mockSearchResponse = {
        data: {
          artists: {
            items: [
              {
                id: 'artist1',
                name: 'Test Artist 1',
                external_urls: { spotify: 'https://open.spotify.com/artist/artist1' },
                images: [{ url: 'https://example.com/image1.jpg' }]
              },
              {
                id: 'artist2',
                name: 'Test Artist 2',
                external_urls: { spotify: 'https://open.spotify.com/artist/artist2' },
                images: []
              }
            ]
          }
        }
      };

      mockAxios.post.mockResolvedValue(mockTokenResponse);
      mockAxios.get.mockResolvedValue(mockSearchResponse);

      const result = await SpotifyService.searchArtists('test query');

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/search?q=test%20query&type=artist&limit=10',
        {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        }
      );

      expect(result).toEqual([
        {
          id: 'artist1',
          name: 'Test Artist 1',
          href: 'https://open.spotify.com/artist/artist1',
          imageUrl: 'https://example.com/image1.jpg'
        },
        {
          id: 'artist2',
          name: 'Test Artist 2',
          href: 'https://open.spotify.com/artist/artist2',
          imageUrl: null
        }
      ]);
    });

    test('devrait gérer les artistes sans images', async () => {
      const mockTokenResponse = {
        data: { access_token: 'test-token', expires_in: 3600 }
      };

      const mockSearchResponse = {
        data: {
          artists: {
            items: [
              {
                id: 'artist1',
                name: 'Test Artist',
                external_urls: { spotify: 'https://open.spotify.com/artist/artist1' },
                images: []
              }
            ]
          }
        }
      };

      mockAxios.post.mockResolvedValue(mockTokenResponse);
      mockAxios.get.mockResolvedValue(mockSearchResponse);

      const result = await SpotifyService.searchArtists('test');

      expect(result[0].imageUrl).toBe(null);
    });

    test('devrait lever une erreur en cas d\'échec de la recherche', async () => {
      const mockTokenResponse = {
        data: { access_token: 'test-token', expires_in: 3600 }
      };

      mockAxios.post.mockResolvedValue(mockTokenResponse);
      mockAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(SpotifyService.searchArtists('test'))
        .rejects.toThrow('Erreur lors de la recherche d\'artistes sur Spotify');
      
      // Vérifier que console.error a été appelé
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erreur lors de la recherche d\'artistes:', 
        'API Error'
      );
    });

    test('devrait encoder correctement les caractères spéciaux dans la requête', async () => {
      const mockTokenResponse = {
        data: { access_token: 'test-token', expires_in: 3600 }
      };

      const mockSearchResponse = {
        data: { artists: { items: [] } }
      };

      mockAxios.post.mockResolvedValue(mockTokenResponse);
      mockAxios.get.mockResolvedValue(mockSearchResponse);

      await SpotifyService.searchArtists('artiste français & rock');

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/search?q=artiste%20fran%C3%A7ais%20%26%20rock&type=artist&limit=10',
        expect.any(Object)
      );
    });
  });

  describe('Gestion des erreurs', () => {
    test('devrait gérer les erreurs réseau', async () => {
      mockAxios.post.mockRejectedValue(new Error('Network Error'));

      await expect(SpotifyService.getAccessToken())
        .rejects.toThrow('Impossible de s\'authentifier avec Spotify');
      
      // Vérifier que console.error a été appelé
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erreur lors de l\'authentification Spotify:', 
        'Network Error'
      );
    });

    test('devrait gérer les réponses API malformées', async () => {
      const mockTokenResponse = {
        data: { access_token: 'test-token', expires_in: 3600 }
      };

      const malformedResponse = {
        data: {} // Pas de propriété artists
      };

      mockAxios.post.mockResolvedValue(mockTokenResponse);
      mockAxios.get.mockResolvedValue(malformedResponse);

      // Mock console.warn également pour ce test
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await SpotifyService.searchArtists('test');
      
      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Réponse API Spotify malformée, retour d\'un tableau vide');
      
      consoleWarnSpy.mockRestore();
    });

    test('devrait gérer les réponses avec artists.items undefined', async () => {
      const mockTokenResponse = {
        data: { access_token: 'test-token', expires_in: 3600 }
      };

      const malformedResponse = {
        data: { 
          artists: {} // Pas de propriété items
        }
      };

      mockAxios.post.mockResolvedValue(mockTokenResponse);
      mockAxios.get.mockResolvedValue(malformedResponse);

      // Mock console.warn également pour ce test
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await SpotifyService.searchArtists('test');
      
      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Réponse API Spotify malformée, retour d\'un tableau vide');
      
      consoleWarnSpy.mockRestore();
    });
  });
});