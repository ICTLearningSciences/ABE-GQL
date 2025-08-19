/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import * as mongoose from "mongoose";

import {
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
} from "graphql";
import DateType from "../types/date";
import {
  PaginateOptions,
  PaginateQuery,
  PaginatedResolveResult,
  pluginPagination,
} from "./Paginatation";
const Schema = mongoose.Schema;

export enum Sender {
  USER = "USER",
  SYSTEM = "SYSTEM",
}

export interface ChatItem {
  sender: Sender;
  message: string;
}

export const ChatItemInputType = new GraphQLInputObjectType({
  name: "ChatItemInputType",
  fields: () => ({
    sender: { type: GraphQLString },
    message: { type: GraphQLString },
    displayType: { type: GraphQLString },
    bulletPoints: { type: GraphQLList(GraphQLString) },
  }),
});

export const ChatItemObjectType = new GraphQLObjectType({
  name: "ChatItemObjectType",
  fields: () => ({
    sender: { type: GraphQLString },
    message: { type: GraphQLString },
    displayType: { type: GraphQLString },
    bulletPoints: { type: GraphQLList(GraphQLString) },
  }),
});

export interface IIntention {
  description: string;
}

export const IntentionInputType = new GraphQLInputObjectType({
  name: "IntentionInputType",
  fields: () => ({
    description: { type: GraphQLString },
  }),
});

export const IntentionObjectType = new GraphQLObjectType({
  name: "IntentionObjectType",
  fields: () => ({
    description: { type: GraphQLString },
    createdAt: { type: DateType },
  }),
});

export const IntentionSchema = new Schema(
  {
    description: String,
  },
  { timestamps: true }
);

export const GDocVersionInputType = new GraphQLInputObjectType({
  name: "GDocVersionInputType",
  fields: () => ({
    docId: { type: GraphQLNonNull(GraphQLString) },
    plainText: { type: GraphQLString },
    plainTextDelta: { type: GraphQLString },
    markdownText: { type: GraphQLString },
    markdownTextDelta: { type: GraphQLString },
    lastChangedId: { type: GraphQLString },
    sessionId: { type: GraphQLNonNull(GraphQLString) },
    sessionIntention: { type: IntentionInputType },
    dayIntention: { type: IntentionInputType },
    documentIntention: { type: IntentionInputType },
    chatLog: { type: GraphQLList(ChatItemInputType) },
    courseAssignmentId: { type: GraphQLString },
    activity: { type: GraphQLString },
    intent: { type: GraphQLString },
    title: { type: GraphQLString },
    lastModifyingUser: { type: GraphQLString },
    modifiedTime: { type: DateType },
    versionType: { type: GraphQLString },
  }),
});

export const GDocVersionObjectType = new GraphQLObjectType({
  name: "GDocVersionObjectType",
  fields: () => ({
    _id: { type: GraphQLString },
    docId: { type: GraphQLString },
    plainText: { type: GraphQLString },
    plainTextDelta: { type: GraphQLString },
    markdownText: { type: GraphQLString },
    markdownTextDelta: { type: GraphQLString },
    lastChangedId: { type: GraphQLString },
    sessionId: { type: GraphQLString },
    sessionIntention: { type: IntentionObjectType },
    documentIntention: { type: IntentionObjectType },
    dayIntention: { type: IntentionObjectType },
    title: { type: GraphQLString },
    chatLog: { type: GraphQLList(ChatItemObjectType) },
    courseAssignmentId: { type: GraphQLString },
    activity: { type: GraphQLString },
    intent: { type: GraphQLString },
    lastModifyingUser: { type: GraphQLString },
    modifiedTime: { type: DateType },
    versionType: { type: GraphQLString },
    createdAt: { type: DateType },
    updatedAt: { type: DateType },
  }),
});

export interface IGDocVersion {
  _id: string;
  docId: string;
  plainText: string;
  plainTextDelta: string;
  markdownText?: string;
  markdownTextDelta?: string;
  lastChangedId: string;
  sessionId: string;
  sessionIntention: IIntention;
  documentIntention: IIntention;
  dayIntention: IIntention;
  chatLog: ChatItem[];
  courseAssignmentId: string;
  activity: string;
  intent: string;
  title: string;
  lastModifyingUser: string;
  modifiedTime: Date;
  versionType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GDocVersionModel extends mongoose.Model<IGDocVersion> {
  paginate(
    query?: PaginateQuery<IGDocVersion>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<IGDocVersion>>;
}

export enum VersionType {
  SNAPSHOT = "SNAPSHOT",
  DELTA = "DELTA",
}

export const GDocVersionSchema = new Schema(
  {
    docId: String,
    plainText: String,
    plainTextDelta: String,
    markdownText: String,
    markdownTextDelta: String,
    lastChangedId: String,
    sessionId: String,
    courseAssignmentId: { type: String, required: false, default: "" },
    sessionIntention: IntentionSchema,
    documentIntention: IntentionSchema,
    dayIntention: IntentionSchema,
    chatLog: [
      {
        sender: String,
        message: String,
        displayType: String,
        bulletPoints: [String],
      },
    ],
    activity: String,
    intent: String,
    title: String,
    lastModifyingUser: String,
    modifiedTime: Date,
    versionType: { type: String, default: VersionType.SNAPSHOT },
  },
  { timestamps: true }
);

pluginPagination(GDocVersionSchema);

GDocVersionSchema.index({ createdAt: -1, _id: -1 });

export default mongoose.model<IGDocVersion, GDocVersionModel>(
  "GoogleDocVersion",
  GDocVersionSchema
);

export const DocVersionCurrentStateModel = mongoose.model<
  IGDocVersion,
  GDocVersionModel
>("DocVersionCurrentState", GDocVersionSchema);
