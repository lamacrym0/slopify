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
  const { events, loading } = useEvents();
  const centerSion = [46.2276, 7.3606];

  if (loading) return <p>Chargement des événements...</p>;
  

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
          <Marker key={index} position={event.location}>
            <Popup>
              <strong>{event.name}</strong><br />
              Du {format(from, "dd MMM yyyy")} au {format(to, "dd MMM yyyy")}<br />
              <em>Artistes :</em><br />
              <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                {event.artists.map((a, i) => <li key={i}>{a.name}</li>)}
              </ul>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapView;
