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
  GraphQLBoolean,
  GraphQLID,
  GraphQLInputObjectType,
} from "graphql";
import {
  OpenAiPromptStep,
  OpenAiPromptStepInputType,
  OpenAiPromptStepType,
} from "./PromptRun";
import { PromptRoles } from "../types/types";

export interface Prompt extends Document {
  _id: string;
  openAiPromptSteps: OpenAiPromptStep[];
  clientId?: string;
  title: string;
  userInputIsIntention?: boolean;
}

export const PromptType = new GraphQLObjectType({
  name: "PromptType",
  fields: () => ({
    _id: { type: GraphQLID },
    openAiPromptSteps: { type: GraphQLList(OpenAiPromptStepType) },
    clientId: { type: GraphQLString },
    title: { type: GraphQLString },
    userInputIsIntention: { type: GraphQLBoolean },
  }),
});

export const PromptInputType = new GraphQLInputObjectType({
  name: "PromptInputType",
  fields: () => ({
    _id: { type: GraphQLID },
    openAiPromptSteps: { type: GraphQLList(OpenAiPromptStepInputType) },
    clientId: { type: GraphQLString },
    title: { type: GraphQLString },
    userInputIsIntention: { type: GraphQLBoolean },
  }),
});

export enum PromptOutputDataType {
  JSON = "JSON",
  TEXT = "TEXT",
}

export const PromptSchema = new Schema(
  {
    openAiPromptSteps: [
      {
        prompts: [
          {
            promptText: { type: String, required: true },
            includeEssay: { type: Boolean, required: true },
            includeUserInput: {
              type: Boolean,
              required: false,
              default: false,
            },
            promptRole: {
              type: String,
              enum: PromptRoles,
              required: false,
            },
          },
        ],
        outputDataType: {
          type: String,
          enum: [PromptOutputDataType.JSON, PromptOutputDataType.TEXT],
          required: false,
          default: PromptOutputDataType.TEXT,
        },
        targetGptModel: {
          type: String,
          required: false,
          default: "gpt-3.5-turbo-16k",
        },
        customSystemRole: {
          type: String,
          required: false,
          default: "",
        },
        includeChatLogContext: {
          type: Boolean,
          required: false,
          default: false,
        },
        jsonValidation: { type: String, required: false, default: "" },
      },
    ],
    title: { type: String, required: true },
    userInputIsIntention: { type: Boolean, required: false, default: false },
    clientId: { type: String, required: false, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Prompt", PromptSchema);
