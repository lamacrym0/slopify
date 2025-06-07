import SimpleSchema from "simpl-schema";

export const EventSchema = new SimpleSchema({
  name: { type: String },
  dateFrom: { type: String },
  dateTo: { type: String },
  location: {
    type: Array,
    minCount: 2,
    maxCount: 2
  },
  "location.$": Number,

  artists: {
    type: Array,
    optional: true
  },
  "artists.$": Object, 

  "artists.$.id": {
    type: String,
    optional: true
  },

  "artists.$.name": {
    type: String,
  },

  "artists.$.href": {
    type: String,
    optional: true
  },

  "artists.$.imageUrl": {
    type: String,
    optional: true
  },

  createdBy: {
    type: String,
  }
});