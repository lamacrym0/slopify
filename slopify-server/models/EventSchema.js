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

  "artists.$.name": {
    type: String,
  },

  createdBy: {
    type: String,
  }
});

