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
import { PromptOutputDataType, PromptRoles } from "../types/types";
import {
  AiModelService,
  AiModelServiceInputType,
  AiModelServiceSchema,
  AiModelServiceType,
} from "./Config";

export interface AiReqRes {
  aiServiceRequestParams: string; //OpenAI.Chat.Completions.ChatCompletionCreateParams;
  aiServiceResponse: string; //OpenAI.Chat.Completions.ChatCompletion.Choice[];
}

export interface PromptConfiguration {
  promptText: string;
  includeEssay: boolean;
  includeUserInput?: boolean;
  promptRole: PromptRoles;
}

export interface AiPromptStep {
  prompts: PromptConfiguration[];
  outputDataType: PromptOutputDataType;
  targetAiServiceModel: AiModelService;
  systemRole?: string;
  includeChatLogContext?: boolean;
  jsonValidation?: string;
  responseFormat?: string;
  webSearch?: boolean;
}

export interface PromptRun {
  promptConfiguration: AiPromptStep[];
  googleDocId: string;
  user: User["_id"];
  aiSteps: AiReqRes[];
}

export const AiStepsType = new GraphQLObjectType({
  name: "AiStepsType",
  fields: () => ({
    aiServiceRequestParams: { type: GraphQLString },
    aiServiceResponse: { type: GraphQLString },
  }),
});

export const AiStepsInputType = new GraphQLInputObjectType({
  name: "AiStepsInputType",
  fields: () => ({
    aiServiceRequestParams: { type: GraphQLString },
    aiServiceResponse: { type: GraphQLString },
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

export const AiPromptStepType = new GraphQLObjectType({
  name: "AiPromptStepType",
  fields: () => ({
    prompts: { type: GraphQLList(PromptConfigurationType) },
    outputDataType: { type: GraphQLString },
    targetAiServiceModel: { type: AiModelServiceType },
    systemRole: { type: GraphQLString },
    includeChatLogContext: { type: GraphQLBoolean },
    jsonValidation: { type: GraphQLString },
    responseFormat: { type: GraphQLString },
    webSearch: { type: GraphQLBoolean },
  }),
});

export const AiPromptStepInputType = new GraphQLInputObjectType({
  name: "AiPromptStepInputType",
  fields: () => ({
    prompts: { type: GraphQLList(PromptConfigurationInputType) },
    outputDataType: { type: GraphQLString },
    targetAiServiceModel: { type: AiModelServiceInputType },
    systemRole: { type: GraphQLString },
    includeChatLogContext: { type: GraphQLBoolean },
    jsonValidation: { type: GraphQLString },
    responseFormat: { type: GraphQLString },
    webSearch: { type: GraphQLBoolean },
  }),
});

export const AiPromptStepSchema = new Schema({
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
  targetAiServiceModel: {
    type: AiModelServiceSchema,
    required: false,
  },
  systemRole: {
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
  responseFormat: { type: String, required: false, default: "" },
  webSearch: { type: Boolean, required: false, default: false },
});

export const PromptRunType = new GraphQLObjectType({
  name: "PromptRunType",
  fields: () => ({
    aiPromptSteps: { type: GraphQLList(AiPromptStepType) },
    googleDocId: { type: GraphQLString },
    user: { type: GraphQLID },
    aiSteps: { type: GraphQLList(AiStepsType) },
  }),
});

export const PromptRunInputType = new GraphQLInputObjectType({
  name: "PromptRunInputType",
  fields: () => ({
    aiPromptSteps: { type: GraphQLList(AiPromptStepInputType) },
    googleDocId: { type: GraphQLString },
    user: { type: GraphQLID },
    aiSteps: { type: GraphQLList(AiStepsInputType) },
  }),
});

export const PromptRunSchema = new Schema(
  {
    aiPromptSteps: [{ type: AiPromptStepSchema }],
    googleDocId: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    aiSteps: [
      {
        aiServiceRequestParams: { type: String, required: true },
        aiServiceResponse: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<PromptRun>("PromptRun", PromptRunSchema);
