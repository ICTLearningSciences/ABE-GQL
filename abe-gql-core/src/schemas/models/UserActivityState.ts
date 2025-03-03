/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
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
