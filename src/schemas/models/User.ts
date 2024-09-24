/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Document, Model } from "mongoose";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLID,
  GraphQLInputObjectType,
} from "graphql";
import { DateType } from "../types/date";
import {
  PaginatedResolveResult,
  PaginateOptions,
  PaginateQuery,
  pluginPagination,
} from "./Paginatation";

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export interface User extends Document {
  googleId: string;
  name: string;
  email: string;
  userRole: UserRole;
  lastLoginAt: Date;
}

export const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    _id: { type: GraphQLID },
    googleId: { type: GraphQLString },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    userRole: { type: GraphQLString },
    lastLoginAt: { type: DateType },
  }),
});

export const UserInputType = new GraphQLInputObjectType({
  name: "UserInputType",
  fields: () => ({
    googleId: { type: GraphQLString },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    userRole: { type: GraphQLString },
    lastLoginAt: { type: DateType },
  }),
});

export const UserSchema = new Schema<User, UserModel>(
  {
    googleId: { type: String },
    name: { type: String },
    email: { type: String },
    userRole: {
      type: String,
      enum: [UserRole.USER, UserRole.ADMIN],
      default: UserRole.USER,
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

export interface UserModel extends Model<User> {
  paginate(
    query?: PaginateQuery<User>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<User>>;
}

UserSchema.index({ name: -1, _id: -1 });
UserSchema.index({ email: -1, _id: -1 });
UserSchema.index({ lastLoginAt: -1, _id: -1 });
UserSchema.index({ userRole: -1, _id: -1 });
pluginPagination(UserSchema);

export default mongoose.model<User, UserModel>("User", UserSchema);
