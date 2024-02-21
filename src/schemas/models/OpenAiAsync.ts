/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Document, Schema } from "mongoose";
import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLID,
  GraphQLInputObjectType,
} from "graphql";
import {
  OpenAiReqRes,
  OpenAiStepsInputType,
  OpenAiStepsType,
} from "./PromptRun";

export enum OpenAiAsyncStatus {
  QUEUED = "QUEUED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETE = "COMPLETE",
}

export interface OpenAIAsync extends Document {
  _id: string;
  openAiData: OpenAiReqRes[];
  status: OpenAiAsyncStatus;
  answer: string;
}

export const OpenAiAsyncType = new GraphQLObjectType({
  name: "OpenAiAsyncType",
  fields: () => ({
    _id: { type: GraphQLID },
    openAiData: { type: GraphQLList(OpenAiStepsType) },
    status: { type: GraphQLString },
    answer: { type: GraphQLString },
  }),
});

export const OpenAiAsyncInputType = new GraphQLInputObjectType({
  name: "OpenAiAsyncInputType",
  fields: () => ({
    _id: { type: GraphQLID },
    openAiData: { type: GraphQLList(OpenAiStepsInputType) },
    status: { type: GraphQLString },
    answer: { type: GraphQLString },
  }),
});

export const OpenAiAsyncSchema = new Schema(
  {
    openAiData: [
      {
        openAiPromptStringify: { type: String },
        openAiResponseStringify: { type: String },
      },
    ],
    status: { type: String, enum: OpenAiAsyncStatus },
    answer: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("OpenAiAsync", OpenAiAsyncSchema);
