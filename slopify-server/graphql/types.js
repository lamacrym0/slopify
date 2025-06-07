const typeDefs = `#graphql
  type Artist {
    id: ID!
    href: String
    imageUrl: String
    name: String!
  }

  type Event {
    _id: ID!
    name: String!
    dateFrom: String!
    dateTo: String!
    location: [Float]!
    artists: [Artist]
    createdBy: ID
  }

  input ArtistInput {
    id: ID
    name: String!
    href: String
    imageUrl: String
  }

  type Query {
    events: [Event]
    myEvents: [Event]
    searchArtist(name: String!): [Artist]
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
    
    searchArtist(name: String!): [Artist]
  }
`;

export default typeDefs;