/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Document, Model, Schema } from "mongoose";
import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
} from "graphql";
import PromptModel, { PromptType, Prompt } from "./Prompt";
import {
  PaginatedResolveResult,
  PaginateOptions,
  PaginateQuery,
  pluginPagination,
} from "./Paginatation";
// Activity Question

export interface StepMessage {
  _id: string;
  text: string;
}

export interface ActivityStep {
  messages: StepMessage[];
  stepName: string;
  stepType: ActivityStepTypes;
  prompts: string[];
  mcqChoices?: string[];
}

export enum ActivityStepTypes {
  FREE_RESPONSE_QUESTION = "FREE_RESPONSE_QUESTION",
  MULTIPLE_CHOICE_QUESTIONS = "MULTIPLE_CHOICE_QUESTIONS",
  MESSAGE = "MESSAGE",
  SHOULD_INCLUDE_ESSAY = "SHOULD_INCLUDE_ESSAY",
}

export const MessageType = new GraphQLObjectType({
  name: "MessageType",
  fields: () => ({
    _id: { type: GraphQLID },
    text: { type: GraphQLString },
  }),
});

export const MessageTypeInput = new GraphQLInputObjectType({
  name: "MessageTypeInput",
  fields: () => ({
    _id: { type: GraphQLID },
    text: { type: GraphQLString },
  }),
});

export const MessageTypeSchema = new Schema(
  {
    text: { type: String, required: true },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

export const ActivityStepType = new GraphQLObjectType({
  name: "ActivityStepType",
  fields: () => ({
    _id: { type: GraphQLID },
    messages: { type: GraphQLList(MessageType) },
    stepName: { type: GraphQLString },
    stepType: { type: GraphQLString },
    mcqChoices: { type: GraphQLList(GraphQLString) },
    prompts: { type: GraphQLList(GraphQLString) },
  }),
});

export const ActivityStepInputType = new GraphQLInputObjectType({
  name: "ActivityStepInputType",
  fields: () => ({
    _id: { type: GraphQLID },
    messages: { type: GraphQLList(MessageTypeInput) },
    stepName: { type: GraphQLString },
    stepType: { type: GraphQLString },
    mcqChoices: { type: GraphQLList(GraphQLString) },
    prompts: { type: GraphQLList(GraphQLString) },
  }),
});

export const ActivityStepSchema = new Schema<ActivityStep>(
  {
    messages: [MessageTypeSchema],
    stepName: { type: String, required: true },
    stepType: { type: String, enum: ActivityStepTypes, required: true },
    mcqChoices: [{ type: String, required: true }],
    prompts: [{ type: String, required: true }], // prompt ids
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

// Activity
export interface Activity extends Document {
  title: string;
  description: string;
  introduction: string;
  displayIcon: string;
  steps: ActivityStep[];
  prompt: Prompt["_id"];
  prompts: ActivityPrompt[];
  disabled?: boolean;
  newDocRecommend?: boolean;
}

// activity prompts
export const ActivityPromptSchema = new Schema<ActivityPrompt>(
  {
    promptId: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

export interface ActivityPrompt {
  _id: string;
  promptId: string;
  order: number;
}

export const ActivityPromptType = new GraphQLObjectType({
  name: "ActivityPromptType",
  fields: () => ({
    _id: { type: GraphQLID },
    promptId: { type: GraphQLID },
    order: { type: GraphQLInt },
  }),
});

export const ActivityPromptInputType = new GraphQLInputObjectType({
  name: "ActivityPromptInputType",
  fields: () => ({
    _id: { type: GraphQLID },
    promptId: { type: GraphQLID },
    order: { type: GraphQLInt },
  }),
});

export const ActivityType = new GraphQLObjectType({
  name: "ActivityType",
  fields: () => ({
    _id: { type: GraphQLID },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    introduction: { type: GraphQLString },
    displayIcon: { type: GraphQLString },
    steps: { type: GraphQLList(ActivityStepType) },
    prompt: {
      type: PromptType,
      resolve: async (activitiy: Activity) => {
        const prompt = await PromptModel.findOne({
          _id: activitiy.prompt,
        });
        return prompt;
      },
    },
    disabled: { type: GraphQLBoolean },
    prompts: { type: GraphQLList(ActivityPromptType) },
    newDocRecommend: { type: GraphQLBoolean },
  }),
});

export const ActivityInputType = new GraphQLInputObjectType({
  name: "ActivityInputType",
  fields: () => ({
    _id: { type: GraphQLID },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    introduction: { type: GraphQLString },
    displayIcon: { type: GraphQLString },
    steps: { type: GraphQLList(ActivityStepInputType) },
    prompt: { type: GraphQLID },
    prompts: { type: GraphQLList(ActivityPromptInputType) },
    disabled: { type: GraphQLBoolean },
    newDocRecommend: { type: GraphQLBoolean },
  }),
});

export const ActivitySchema = new Schema(
  {
    title: { type: String },
    description: { type: String },
    introduction: { type: String },
    displayIcon: { type: String },
    disabled: { type: Boolean, default: false },
    steps: [{ type: ActivityStepSchema }],
    prompt: { type: mongoose.Types.ObjectId, ref: "Prompt" },
    prompts: [{ type: ActivityPromptSchema }],
    newDocRecommend: { type: Boolean, default: false },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

export interface ActivityModel extends Model<Activity> {
  paginate(
    query?: PaginateQuery<Activity>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<Activity>>;
}

pluginPagination(ActivitySchema);

export default mongoose.model<Activity, ActivityModel>(
  "Activity",
  ActivitySchema
);
