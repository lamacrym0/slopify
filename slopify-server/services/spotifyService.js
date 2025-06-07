import axios from 'axios';

class SpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    // Si on a déjà un token valide, on le retourne
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(
              `${this.clientId}:${this.clientSecret}`
            ).toString('base64')}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Le token expire dans 3600 secondes, on enlève 5 minutes de sécurité
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
      
      return this.accessToken;
    } catch (error) {
      console.error('Erreur lors de l\'authentification Spotify:', error.response?.data || error.message);
      throw new Error('Impossible de s\'authentifier avec Spotify');
    }
  }

  async searchArtists(query) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Vérification de la structure de la réponse
      if (!response.data || !response.data.artists || !Array.isArray(response.data.artists.items)) {
        console.warn('Réponse API Spotify malformée, retour d\'un tableau vide');
        return [];
      }

      return response.data.artists.items.map(artist => ({
        id: artist.id,
        name: artist.name,
        href: artist.external_urls?.spotify,
        imageUrl: artist.images?.[0]?.url || null
      }));
    } catch (error) {
      console.error('Erreur lors de la recherche d\'artistes:', error.response?.data || error.message);
      throw new Error('Erreur lors de la recherche d\'artistes sur Spotify');
    }
  }
}

export default new SpotifyService();