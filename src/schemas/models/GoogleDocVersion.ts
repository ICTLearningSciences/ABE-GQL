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

export const GDocVersionInputType = new GraphQLInputObjectType({
  name: "GDocVersionInputType",
  fields: () => ({
    docId: { type: GraphQLNonNull(GraphQLString) },
    plainText: { type: GraphQLNonNull(GraphQLString) },
    lastChangedId: { type: GraphQLString },
    chatLog: { type: GraphQLList(ChatItemInputType) },
    title: { type: GraphQLString },
    lastModifyingUser: { type: GraphQLString },
    modifiedTime: { type: DateType },
  }),
});

export const GDocVersionObjectType = new GraphQLObjectType({
  name: "GDocVersionObjectType",
  fields: () => ({
    docId: { type: GraphQLString },
    plainText: { type: GraphQLString },
    lastChangedId: { type: GraphQLString },
    title: { type: GraphQLString },
    chatLog: { type: GraphQLList(ChatItemObjectType) },
    lastModifyingUser: { type: GraphQLString },
    modifiedTime: { type: DateType },
    createdAt: { type: DateType },
    updatedAt: { type: DateType },
  }),
});

export interface IGDocVersion {
  docId: string;
  plainText: string;
  lastChangedId: string;
  chatLog: ChatItem[];
  title: string;
  lastModifyingUser: string;
  modifiedTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const GDocVersionSchema = new Schema(
  {
    docId: String,
    plainText: String,
    lastChangedId: String,
    chatLog: [
      {
        sender: String,
        message: String,
        displayType: String,
        bulletPoints: [String],
      },
    ],
    title: String,
    lastModifyingUser: String,
    modifiedTime: Date,
  },
  { timestamps: true }
);

export default mongoose.model("GoogleDocVersion", GDocVersionSchema);
