// src/components/MapView.jsx
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import useEvents from "../hooks/useEvents";
import { parse, format } from "date-fns";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href
});

const MapView = () => {
  const { events, loading, error } = useEvents();
  const centerSion = [46.2276, 7.3606];

  if (loading) return <p>Chargement des événements...</p>;
  if (error && events.length === 0) return <p>Erreur lors du chargement des événements.</p>;

  return (
    <MapContainer
      center={centerSion}
      zoom={10}
      scrollWheelZoom={true}
      style={{ height: "calc(100vh - 64px)", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {events.map((event, index) => {
        const from = parse(event.dateFrom, "yyyyMMdd", new Date());
        const to = parse(event.dateTo, "yyyyMMdd", new Date());
        
        return (
          <Marker key={event._id || index} position={event.location}>
            <Popup>
              <div style={{ minWidth: "200px" }}>
                <strong>{event.name}</strong><br />
                Du {format(from, "dd MMM yyyy")} au {format(to, "dd MMM yyyy")}<br />
                <em>Artistes :</em><br />
                {event.artists && event.artists.length > 0 ? (
                  <div style={{ marginTop: "8px" }}>
                    {event.artists.map((artist, artistIndex) => (
                      <div key={artist.id || artistIndex} style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        marginBottom: "4px",
                        gap: "8px"
                      }}>
                        {artist.imageUrl && (
                          <img 
                            src={artist.imageUrl} 
                            alt={artist.name}
                            style={{ 
                              width: "30px", 
                              height: "30px", 
                              borderRadius: "50%",
                              objectFit: "cover"
                            }} 
                          />
                        )}
                        {artist.href ? (
                          <a 
                            href={artist.href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              textDecoration: "none", 
                              color: "#1976d2",
                              fontWeight: "500"
                            }}
                          >
                            {artist.name}
                          </a>
                        ) : (
                          <span>{artist.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: "4px 0", color: "#666" }}>Aucun artiste spécifié</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapView;