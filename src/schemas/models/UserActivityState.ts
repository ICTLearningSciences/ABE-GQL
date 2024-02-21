import mongoose, { Document, Schema } from "mongoose";
import { GraphQLObjectType, GraphQLID, GraphQLString } from "graphql";
import { User } from "./User";
import { Activity } from "./Activity";

export interface UserActivityState extends Document {
  userId: User["_id"];
  activityId: Activity["_id"];
  googleDocId: string;
  metadata: string;
}

export const UserActivityStateType = new GraphQLObjectType({
  name: "UserActivityStateType",
  fields: () => ({
    _id: { type: GraphQLID },
    userId: { type: GraphQLID },
    activityId: { type: GraphQLID },
    googleDocId: { type: GraphQLString },
    metadata: { type: GraphQLString },
  }),
});

export const UserActivityStateSchema = new Schema<UserActivityState>(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User" },
    activityId: { type: mongoose.Types.ObjectId, ref: "Activity" },
    googleDocId: { type: String },
    metadata: { type: String },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

UserActivityStateSchema.index(
  { userId: 1, activityId: 1, googleDocId: 1 },
  { unique: true }
);

export default mongoose.model<UserActivityState>(
  "UserActivityState",
  UserActivityStateSchema
);
