import React, { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";

const MY_EVENTS = gql`
  query {
    myEvents {
      _id
      name
      dateFrom
      dateTo
      location
      artists {
        name
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
  const [deleteEvent] = useMutation(DELETE_EVENT);

  const [form, setForm] = useState({
    name: "",
    dateFrom: "",
    dateTo: "",
    locationX: "",
    locationY: "",
    artistsRaw: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const artists = form.artistsRaw
      .split(",")
      .map((name) => ({ name: name.trim() }));

    await createEvent({
      variables: {
        name: form.name,
        dateFrom: form.dateFrom,
        dateTo: form.dateTo,
        location: [parseFloat(form.locationX), parseFloat(form.locationY)],
        artists,
      },
    });

    setForm({ name: "", dateFrom: "", dateTo: "", locationX: "", locationY: "", artistsRaw: "" });
    refetch();
  };

  const handleDelete = async (id) => {
    await deleteEvent({ variables: { eventId: id } });
    refetch();
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <h2>Mes événements</h2>

      <form onSubmit={handleSubmit}>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom" />
        <input value={form.dateFrom} onChange={(e) => setForm({ ...form, dateFrom: e.target.value })} placeholder="Date début" />
        <input value={form.dateTo} onChange={(e) => setForm({ ...form, dateTo: e.target.value })} placeholder="Date fin" />
        <input value={form.locationX} onChange={(e) => setForm({ ...form, locationX: e.target.value })} placeholder="Longitude" />
        <input value={form.locationY} onChange={(e) => setForm({ ...form, locationY: e.target.value })} placeholder="Latitude" />
        <input value={form.artistsRaw} onChange={(e) => setForm({ ...form, artistsRaw: e.target.value })} placeholder="Artistes (séparés par virgules)" />
        <button type="submit">Ajouter</button>
      </form>

      <ul>
        {data.myEvents.map((event) => (
          <li key={event._id}>
            <strong>{event.name}</strong> - {event.dateFrom} → {event.dateTo}
            <br />
            Artistes : {event.artists.map((a) => a.name).join(", ")}
            <br />
            <button onClick={() => handleDelete(event._id)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
