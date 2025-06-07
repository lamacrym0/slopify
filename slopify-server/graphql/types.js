const typeDefs = `#graphql
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

  input ArtistInput {
    name: String!
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
      artists: [ArtistInput]
      location: [Float]
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
`;

export default typeDefs;
