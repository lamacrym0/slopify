import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Alert,
  CircularProgress,
  Box,
  Typography
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

const SEARCH_ARTIST = gql`
  mutation SearchArtist($name: String!) {
    searchArtist(name: $name) {
      id
      name
      href
      imageUrl
    }
  }
`;

export default function ArtistSearch({ open, onClose, onSelectArtist }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchArtist, { loading, error }] = useMutation(SEARCH_ARTIST);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      const { data } = await searchArtist({
        variables: { name: searchTerm }
      });
      setSearchResults(data.searchArtist || []);
    } catch (err) {
      console.error("Erreur lors de la recherche:", err);
    }
  };

  const handleSelectArtist = (artist) => {
    onSelectArtist(artist);
    setSearchTerm("");
    setSearchResults([]);
    onClose();
  };

  const handleClose = () => {
    setSearchTerm("");
    setSearchResults([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rechercher un artiste</DialogTitle>
      <DialogContent>
        <Box display="flex" gap={1} mb={2}>
          <TextField
            fullWidth
            label="Nom de l'artiste"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            disabled={loading}
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
            Erreur lors de la recherche: {error.message}
          </Alert>
        )}

        {searchResults.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Résultats de recherche:
            </Typography>
            <List>
              {searchResults.map((artist) => (
                <ListItem
                  key={artist.id}
                  button
                  onClick={() => handleSelectArtist(artist)}
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
                  <ListItemAvatar>
                    <Avatar
                      src={artist.imageUrl}
                      alt={artist.name}
                      sx={{ width: 50, height: 50 }}
                    >
                      {artist.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={artist.name}
                    secondary={artist.href ? "Profil Spotify disponible" : "Artiste local"}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {searchResults.length === 0 && searchTerm && !loading && (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Aucun résultat trouvé pour "{searchTerm}"
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}