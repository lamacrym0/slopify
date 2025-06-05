const typeDefs = `
  type Artist {
    name: String!
  }

  type Event {
    _id: ID!
    name: String!
    dateFrom: String!
    dateTo: String!
    location: [Float]!
    artists: [Artist]
    createdBy: ID!
  }

  type Query {
    events: [Event]
    myEvents: [Event]
  }

  type Mutation {
    createEvent(
      name: String!
      dateFrom: String!
      dateTo: String!
      location: [Float]!
      artists: [ArtistInput]
    ): Event

    updateEvent(
      eventId: ID!
      name: String!
      dateFrom: String!
      dateTo: String!
      location: [Float]!
      artists: [ArtistInput]
    ): Event

    deleteEvent(eventId: ID!): Boolean
  }

  input ArtistInput {
    name: String!
  }
`;

export default typeDefs;
