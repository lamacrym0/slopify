import SimpleSchema from "simpl-schema";

export const UserSchema = new SimpleSchema({
  email: { type: String },
  password: { type: String },
  firstname: { type: String, optional: true },
  lastname: { type: String, optional: true }
});
