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
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLBoolean,
} from "graphql";
import { User } from "./User";
import { PromptOutputDataType } from "./Prompt";
import { PromptRoles } from "../types/types";

export interface OpenAiReqRes {
  openAiPromptStringify: string; //OpenAI.Chat.Completions.ChatCompletionCreateParams;
  openAiResponseStringify: string; //OpenAI.Chat.Completions.ChatCompletion.Choice[];
}

export interface PromptConfiguration {
  promptText: string;
  includeEssay: boolean;
  includeUserInput?: boolean;
  promptRole: PromptRoles;
}

export interface OpenAiPromptStep {
  prompts: PromptConfiguration[];
  outputDataType: PromptOutputDataType;
  targetGptModel: string;
  includeChatLogContext?: boolean;
  jsonValidation?: string;
}

export interface PromptRun {
  promptConfiguration: OpenAiPromptStep[];
  googleDocId: string;
  user: User["_id"];
  openAiSteps: OpenAiReqRes[];
}

export const OpenAiStepsType = new GraphQLObjectType({
  name: "OpenAiStepsType",
  fields: () => ({
    openAiPromptStringify: { type: GraphQLString },
    openAiResponseStringify: { type: GraphQLString },
  }),
});

export const OpenAiStepsInputType = new GraphQLInputObjectType({
  name: "OpenAiStepsInputType",
  fields: () => ({
    openAiPromptStringify: { type: GraphQLString },
    openAiResponseStringify: { type: GraphQLString },
  }),
});

export const PromptConfigurationType = new GraphQLObjectType({
  name: "PromptConfigurationType",
  fields: () => ({
    promptText: { type: GraphQLString },
    includeEssay: { type: GraphQLBoolean },
    includeUserInput: { type: GraphQLBoolean },
    promptRole: { type: GraphQLString },
  }),
});

export const PromptConfigurationInputType = new GraphQLInputObjectType({
  name: "PromptConfigurationInputType",
  fields: () => ({
    promptText: { type: GraphQLString },
    includeEssay: { type: GraphQLBoolean },
    includeUserInput: { type: GraphQLBoolean },
    promptRole: { type: GraphQLString },
  }),
});

export const OpenAiPromptStepType = new GraphQLObjectType({
  name: "OpenAiPromptStepType",
  fields: () => ({
    prompts: { type: GraphQLList(PromptConfigurationType) },
    outputDataType: { type: GraphQLString },
    targetGptModel: { type: GraphQLString },
    includeChatLogContext: { type: GraphQLBoolean },
    jsonValidation: { type: GraphQLString },
  }),
});

export const OpenAiPromptStepInputType = new GraphQLInputObjectType({
  name: "OpenAiPromptStepInputType",
  fields: () => ({
    prompts: { type: GraphQLList(PromptConfigurationInputType) },
    outputDataType: { type: GraphQLString },
    targetGptModel: { type: GraphQLString },
    includeChatLogContext: { type: GraphQLBoolean },
    jsonValidation: { type: GraphQLString },
  }),
});

export const PromptRunType = new GraphQLObjectType({
  name: "PromptRunType",
  fields: () => ({
    openAiPromptSteps: { type: GraphQLList(OpenAiPromptStepType) },
    googleDocId: { type: GraphQLString },
    user: { type: GraphQLID },
    openAiSteps: { type: GraphQLList(OpenAiStepsType) },
  }),
});

export const PromptRunInputType = new GraphQLInputObjectType({
  name: "PromptRunInputType",
  fields: () => ({
    openAiPromptSteps: { type: GraphQLList(OpenAiPromptStepInputType) },
    googleDocId: { type: GraphQLString },
    user: { type: GraphQLID },
    openAiSteps: { type: GraphQLList(OpenAiStepsInputType) },
  }),
});

export const PromptRunSchema = new Schema(
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
        includeChatLogContext: {
          type: Boolean,
          required: false,
          default: false,
        },
        jsonValidation: { type: String, required: false, default: "" },
      },
    ],
    googleDocId: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    openAiSteps: [
      {
        openAiPromptStringify: { type: String, required: true },
        openAiResponseStringify: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("PromptRun", PromptRunSchema);
