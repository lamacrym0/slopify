import { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";

const GET_EVENTS = gql`
  query GetEvents {
    events {
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
      createdBy
    }
  }
`;

export default function useEvents() {
  // Essai avec GraphQL d'abord
  const { data: gqlData, loading: gqlLoading, error: gqlError } = useQuery(GET_EVENTS, {
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true
  });

  // Fallback REST
  const [restEvents, setRestEvents] = useState([]);
  const [restLoading, setRestLoading] = useState(false);
  const [useRest, setUseRest] = useState(false);

  useEffect(() => {
    // Si GraphQL a une erreur critique (pas de données), basculer sur REST
    if (gqlError && !gqlData?.events) {
      console.log("GraphQL error, switching to REST:", gqlError);
      setUseRest(true);
    }
  }, [gqlError, gqlData]);

  useEffect(() => {
    if (useRest) {
      const fetchEvents = async () => {
        try {
          setRestLoading(true);
          const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/events`, {
            method: "GET",
            credentials: "include",
          });
          
          if (!response.ok) throw new Error("Erreur lors du chargement des événements");
          const data = await response.json();
          console.log("REST events loaded:", data);
          
          // Transformer les données REST pour qu'elles ressemblent aux données GraphQL
          const transformedEvents = data.map(event => ({
            ...event,
            artists: (event.artists || []).map(artist => {
              // Si l'artiste est juste une string, le convertir en objet
              if (typeof artist === 'string') {
                return {
                  id: artist,
                  name: artist,
                  href: null,
                  imageUrl: null
                };
              }
              // Si l'artiste est un objet, s'assurer que tous les champs existent
              return {
                id: artist.id || artist.name || 'unknown',
                name: artist.name || 'Artiste inconnu',
                href: artist.href || null,
                imageUrl: artist.imageUrl || null
              };
            })
          }));
          
          setRestEvents(transformedEvents);
        } catch (err) {
          console.error("Erreur de fetch REST /events :", err);
        } finally {
          setRestLoading(false);
        }
      };

      fetchEvents();
    }
  }, [useRest]);

  // Fonction pour nettoyer les données d'événements
  const cleanEvents = (events) => {
    if (!Array.isArray(events)) return [];
    
    return events.filter(event => 
      event && 
      event.name && 
      event.dateFrom && 
      event.dateTo && 
      event.location && 
      Array.isArray(event.location) && 
      event.location.length === 2
    ).map(event => ({
      ...event,
      artists: (event.artists || []).filter(artist => artist && artist.name).map(artist => ({
        id: artist.id || artist.name || 'unknown',
        name: artist.name || 'Artiste inconnu',
        href: artist.href || null,
        imageUrl: artist.imageUrl || null
      }))
    }));
  };

  if (useRest) {
    return {
      events: cleanEvents(restEvents),
      loading: restLoading,
      error: null
    };
  }

  // Si GraphQL a des données même avec des erreurs, les utiliser
  if (gqlData?.events) {
    return {
      events: cleanEvents(gqlData.events),
      loading: gqlLoading,
      error: gqlError
    };
  }

  return {
    events: [],
    loading: gqlLoading,
    error: gqlError
  };
}