import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Chip
} from "@mui/material";
import { Search as SearchIcon, LocationOn as LocationIcon } from "@mui/icons-material";

export default function LocationSearch({ open, onClose, onSelectLocation }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // API Nominatim - recherche de lieux
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Slopify-App' // Recommandé par Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche de lieux');
      }

      const data = await response.json();
      
      // Traiter les résultats pour les rendre plus utilisables
      const processedResults = data.map(item => ({
        id: item.place_id,
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
        importance: item.importance,
        address: item.address || {}
      }));

      setSearchResults(processedResults);
    } catch (err) {
      console.error("Erreur lors de la recherche de lieux:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (location) => {
    onSelectLocation({
      name: location.displayName,
      latitude: location.lat,
      longitude: location.lon,
      type: location.type
    });
    setSearchTerm("");
    setSearchResults([]);
    onClose();
  };

  const handleClose = () => {
    setSearchTerm("");
    setSearchResults([]);
    setError(null);
    onClose();
  };

  const getLocationTypeColor = (type) => {
    switch (type) {
      case 'city':
      case 'town':
      case 'village':
        return 'primary';
      case 'administrative':
        return 'secondary';
      case 'building':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LocationIcon />
          Rechercher un lieu
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" gap={1} mb={2}>
          <TextField
            fullWidth
            label="Nom du lieu (ville, adresse, etc.)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            disabled={loading}
            placeholder="Ex: Sion, Suisse"
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
          >
            Chercher
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {searchResults.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Résultats de recherche:
            </Typography>
            <List>
              {searchResults.map((location) => (
                <ListItem
                  key={location.id}
                  button
                  onClick={() => handleSelectLocation(location)}
                  sx={{ 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 1, 
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="body1" component="span">
                          {location.displayName}
                        </Typography>
                        {location.type && (
                          <Chip 
                            label={location.type} 
                            size="small" 
                            color={getLocationTypeColor(location.type)}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box mt={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          📍 Latitude: {location.lat.toFixed(6)}, Longitude: {location.lon.toFixed(6)}
                        </Typography>
                        {location.address.country && (
                          <Typography variant="body2" color="text.secondary">
                            🌍 {location.address.country}
                            {location.address.state && `, ${location.address.state}`}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {searchResults.length === 0 && searchTerm && !loading && (
          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color="text.secondary">
              Aucun résultat trouvé pour "{searchTerm}"
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Essayez avec un nom de ville, une adresse, ou un point d'intérêt.
            </Typography>
          </Box>
        )}

        {!searchTerm && (
          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color="text.secondary">
              Entrez le nom d'un lieu pour commencer la recherche
            </Typography>
            <Typography variant="caption" color="text.secondary" mt={1} display="block">
              Exemples: "Sion", "Stade de Tourbillon, Sion", "Place du Midi, Sion"
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}