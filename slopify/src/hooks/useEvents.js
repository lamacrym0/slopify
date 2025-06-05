import { useState, useEffect } from "react";

export default function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/events`, {
            method: "GET",
            credentials: "include",
        });
        console.log("Response from /events:", response);
        if (!response.ok) throw new Error("Erreur lors du chargement des événements");
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error("Erreur de fetch /events :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading };
}
