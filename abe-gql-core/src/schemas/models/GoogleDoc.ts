/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema } from "mongoose";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLID,
  GraphQLBoolean,
  GraphQLInputObjectType,
} from "graphql";
import { DateType } from "../types/date";
import { User } from "./User";
import GoogleDocVersionsModel, {
  IIntention,
  IntentionInputType,
  IntentionObjectType,
  IntentionSchema,
} from "./GoogleDocVersion";

export enum DocService {
  GOOGLE_DOCS = "GOOGLE_DOCS",
  MICROSOFT_WORD = "MICROSOFT_WORD",
}

export interface GoogleDoc {
  googleDocId: string;
  wordDocId: string;
  deleted: boolean;
  title: string;
  documentIntention: IIntention;
  currentDayIntention: IIntention;
  assignmentDescription: string;
  service: DocService;
  admin: boolean;
  user: User["_id"];
  userClassroomCode: string;
}

export const GoogleDocType = new GraphQLObjectType({
  name: "GoogleDocType",
  fields: () => ({
    googleDocId: { type: GraphQLString },
    wordDocId: { type: GraphQLString },
    user: { type: GraphQLID },
    deleted: { type: GraphQLBoolean },
    admin: { type: GraphQLBoolean },
    documentIntention: { type: IntentionObjectType },
    currentDayIntention: { type: IntentionObjectType },
    assignmentDescription: { type: GraphQLString },
    service: { type: GraphQLString },
    title: {
      type: GraphQLString,
      resolve: async (doc: GoogleDoc) => {
        const mostRecentVersion = await GoogleDocVersionsModel.findOne(
          { docId: doc.googleDocId },
          {},
          { sort: { createdAt: -1 } }
        );
        return mostRecentVersion?.title || doc.title || "";
      },
    },
    createdAt: { type: DateType },
    userClassroomCode: { type: GraphQLString },
  }),
});

export const GoogleDocInputType = new GraphQLInputObjectType({
  name: "GoogleDocInputType",
  fields: () => ({
    googleDocId: { type: GraphQLString },
    title: { type: GraphQLString },
    wordDocId: { type: GraphQLString },
    user: { type: GraphQLID },
    admin: { type: GraphQLBoolean },
    documentIntention: { type: IntentionInputType },
    currentDayIntention: { type: IntentionInputType },
    assignmentDescription: { type: GraphQLString },
    service: { type: GraphQLString },
  }),
});

export const GoogleDocSchema = new Schema(
  {
    googleDocId: { type: String, required: true },
    wordDocId: { type: String },
    deleted: { type: Boolean, default: false },
    documentIntention: IntentionSchema,
    currentDayIntention: IntentionSchema,
    assignmentDescription: { type: String },
    service: {
      type: String,
      enum: Object.values(DocService),
      default: DocService.GOOGLE_DOCS,
    },
    admin: { type: Boolean, default: false },
    user: { type: mongoose.Types.ObjectId, ref: "User" },
    title: { type: String },
    userClassroomCode: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("GoogleDoc", GoogleDocSchema);
