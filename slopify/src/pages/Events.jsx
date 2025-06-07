import React from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Link,
} from "@mui/material";
import { parse, format } from "date-fns";
import useEvents from "../hooks/useEvents";

export default function Events() {
  const { events, loading, error } = useEvents();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && (!events || events.length === 0)) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Erreur lors du chargement des événements: {error.message}
        </Alert>
      </Container>
    );
  }

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return "Date inconnue";
      const date = parse(dateStr, "yyyyMMdd", new Date());
      return format(date, "dd/MM/yyyy");
    } catch {
      return dateStr || "Date invalide";
    }
  };

  // Filtrer les événements valides
  const validEvents = (events || []).filter(event => 
    event && 
    event.name && 
    event.dateFrom && 
    event.dateTo && 
    event.location && 
    Array.isArray(event.location) && 
    event.location.length === 2
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tous les événements
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Certaines données n'ont pas pu être chargées: {error.message}
        </Alert>
      )}

      {validEvents.length === 0 ? (
        <Box textAlign="center" mt={4}>
          <Typography variant="body1" color="text.secondary">
            Aucun événement disponible pour le moment.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {validEvents.map((event, index) => {
            // Protection supplémentaire au niveau de chaque événement
            if (!event || !event.name) {
              console.warn("Événement invalide ignoré:", event);
              return null;
            }

            return (
              <Grid item xs={12} md={6} lg={4} key={event._id || index}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {event.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Du {formatDate(event.dateFrom)} au {formatDate(event.dateTo)}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      📍 Position: {event.location[0]?.toFixed(4)}, {event.location[1]?.toFixed(4)}
                    </Typography>

                    <Box mt={2}>
                      <Typography variant="body2" gutterBottom fontWeight="medium">
                        Artistes:
                      </Typography>
                      
                      {event.artists && event.artists.length > 0 ? (
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {event.artists.filter(artist => artist && artist.name).map((artist, artistIndex) => (
                            <Box key={artist.id || artistIndex} display="flex" alignItems="center">
                              {artist.href ? (
                                <Link
                                  href={artist.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  underline="none"
                                >
                                  <Chip
                                    label={artist.name}
                                    size="small"
                                    avatar={
                                      artist.imageUrl ? 
                                        <Avatar src={artist.imageUrl} sx={{ width: 24, height: 24 }} /> : 
                                        undefined
                                    }
                                    clickable
                                    sx={{ 
                                      '&:hover': { 
                                        backgroundColor: 'primary.light',
                                        color: 'primary.contrastText'
                                      }
                                    }}
                                  />
                                </Link>
                              ) : (
                                <Chip
                                  label={artist.name}
                                  size="small"
                                  avatar={
                                    artist.imageUrl ? 
                                      <Avatar src={artist.imageUrl} sx={{ width: 24, height: 24 }} /> : 
                                      undefined
                                  }
                                />
                              )}
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          Aucun artiste spécifié
                        </Typography>
                      )}
                    </Box>

                    {event.createdBy && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                        Créé par: {event.createdBy}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}