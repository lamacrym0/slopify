import React, { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { parse, format } from "date-fns";
import ArtistSearch from "../components/ArtistSearch";
import LocationSearch from "../components/LocationSearch";

const MY_EVENTS = gql`
  query GetMyEvents {
    myEvents {
      _id
      name
      dateFrom
      dateTo
      location
      artists {
        id
        name
        href
        imageUrl
      }
    }
  }
`;

const CREATE_EVENT = gql`
  mutation CreateEvent(
    $name: String!
    $dateFrom: String!
    $dateTo: String!
    $location: [Float]!
    $artists: [ArtistInput]
  ) {
    createEvent(
      name: $name
      dateFrom: $dateFrom
      dateTo: $dateTo
      location: $location
      artists: $artists
    ) {
      _id
      name
      dateFrom
      dateTo
      location
      artists {
        id
        name
        href
        imageUrl
      }
    }
  }
`;

const UPDATE_EVENT = gql`
  mutation UpdateEvent(
    $eventId: ID!
    $name: String!
    $dateFrom: String!
    $dateTo: String!
    $location: [Float]!
    $artists: [ArtistInput]
  ) {
    updateEvent(
      eventId: $eventId
      name: $name
      dateFrom: $dateFrom
      dateTo: $dateTo
      location: $location
      artists: $artists
    ) {
      _id
      name
      dateFrom
      dateTo
      location
      artists {
        id
        name
        href
        imageUrl
      }
    }
  }
`;

const DELETE_EVENT = gql`
  mutation DeleteEvent($eventId: ID!) {
    deleteEvent(eventId: $eventId)
  }
`;

export default function MyEvents() {
  const { data, loading, refetch } = useQuery(MY_EVENTS);
  const [createEvent] = useMutation(CREATE_EVENT);
  const [updateEvent] = useMutation(UPDATE_EVENT);
  const [deleteEvent] = useMutation(DELETE_EVENT);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [artistSearchOpen, setArtistSearchOpen] = useState(false);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    dateFrom: "",
    dateTo: "",
    locationX: "",
    locationY: "",
  });

  const [selectedArtists, setSelectedArtists] = useState([]);

  const resetForm = () => {
    setForm({
      name: "",
      dateFrom: "",
      dateTo: "",
      locationX: "",
      locationY: "",
    });
    setSelectedArtists([]);
    setEditingEvent(null);
    setError("");
  };

  const openDialog = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setForm({
        name: event.name,
        dateFrom: event.dateFrom,
        dateTo: event.dateTo,
        locationX: event.location[0].toString(),
        locationY: event.location[1].toString(),
      });
      setSelectedArtists(event.artists || []);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleAddArtist = (artist) => {
    // Vérifier si l'artiste n'est pas déjà ajouté
    if (!selectedArtists.find(a => a.id === artist.id)) {
      setSelectedArtists([...selectedArtists, artist]);
    }
  };

  const handleRemoveArtist = (artistId) => {
    setSelectedArtists(selectedArtists.filter(a => a.id !== artistId));
  };

  const handleSelectLocation = (location) => {
    setForm({
      ...form,
      locationX: location.latitude.toString(),
      locationY: location.longitude.toString(),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const variables = {
        name: form.name,
        dateFrom: form.dateFrom,
        dateTo: form.dateTo,
        location: [parseFloat(form.locationX), parseFloat(form.locationY)],
        artists: selectedArtists.map(artist => ({
          id: artist.id,
          name: artist.name,
          href: artist.href,
          imageUrl: artist.imageUrl
        })),
      };

      if (editingEvent) {
        await updateEvent({
          variables: { eventId: editingEvent._id, ...variables },
        });
      } else {
        await createEvent({ variables });
      }

      closeDialog();
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      try {
        await deleteEvent({ variables: { eventId: id } });
        refetch();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = parse(dateStr, "yyyyMMdd", new Date());
      return format(date, "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  if (loading) return <Typography>Chargement...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Mes événements
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openDialog()}
        >
          Ajouter un événement
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {data?.myEvents?.map((event) => (
          <Grid item xs={12} md={6} lg={4} key={event._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {event.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Du {formatDate(event.dateFrom)} au {formatDate(event.dateTo)}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Position: {event.location[0]}, {event.location[1]}
                </Typography>
                <Box mt={1}>
                  <Typography variant="body2" gutterBottom>
                    Artistes:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {event.artists?.map((artist, index) => (
                      <Chip 
                        key={artist.id || index}
                        label={artist.name}
                        size="small"
                        avatar={artist.imageUrl ? <Avatar src={artist.imageUrl} /> : undefined}
                        onClick={artist.href ? () => window.open(artist.href, '_blank') : undefined}
                        clickable={!!artist.href}
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
              <CardActions>
                <IconButton onClick={() => openDialog(event)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(event._id)}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {data?.myEvents?.length === 0 && (
        <Typography variant="body1" textAlign="center" mt={4}>
          Vous n'avez pas encore créé d'événements.
        </Typography>
      )}

      {/* Dialog pour créer/modifier un événement */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEvent ? "Modifier l'événement" : "Ajouter un événement"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              label="Nom de l'événement"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Date de début (YYYYMMDD)"
              value={form.dateFrom}
              onChange={(e) => setForm({ ...form, dateFrom: e.target.value })}
              placeholder="20250717"
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Date de fin (YYYYMMDD)"
              value={form.dateTo}
              onChange={(e) => setForm({ ...form, dateTo: e.target.value })}
              placeholder="20250720"
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Latitude"
              type="number"
              value={form.locationX}
              onChange={(e) => setForm({ ...form, locationX: e.target.value })}
              step="any"
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Longitude"
              type="number"
              value={form.locationY}
              onChange={(e) => setForm({ ...form, locationY: e.target.value })}
              step="any"
              required
            />
            
            {/* Bouton de recherche de lieu */}
            <Box mt={1} mb={2}>
              <Button
                variant="outlined"
                startIcon={<LocationIcon />}
                onClick={() => setLocationSearchOpen(true)}
                fullWidth
              >
                Chercher un lieu
              </Button>
            </Box>

            {/* Section Artistes */}
            <Box mt={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Artistes</Typography>
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setArtistSearchOpen(true)}
                >
                  Ajouter un artiste
                </Button>
              </Box>

              {selectedArtists.length > 0 ? (
                <List>
                  {selectedArtists.map((artist) => (
                    <ListItem key={artist.id} divider>
                      <ListItemAvatar>
                        <Avatar src={artist.imageUrl}>
                          {artist.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={artist.name}
                        secondary={artist.href ? "Profil Spotify" : "Artiste local"}
                      />
                      <ListItemSecondaryAction>
                        <IconButton onClick={() => handleRemoveArtist(artist.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" p={2}>
                  Aucun artiste ajouté
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Annuler</Button>
            <Button type="submit" variant="contained">
              {editingEvent ? "Modifier" : "Créer"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog de recherche d'artistes */}
      <ArtistSearch
        open={artistSearchOpen}
        onClose={() => setArtistSearchOpen(false)}
        onSelectArtist={handleAddArtist}
      />

      {/* Dialog de recherche de lieux */}
      <LocationSearch
        open={locationSearchOpen}
        onClose={() => setLocationSearchOpen(false)}
        onSelectLocation={handleSelectLocation}
      />
    </Container>
  );
}