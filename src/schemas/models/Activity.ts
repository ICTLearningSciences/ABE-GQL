import mongoose, { Document, Schema } from "mongoose";
import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
} from "graphql";
import PromptModel, { PromptType, Prompt } from "./Prompt";

// Activity Question

export interface ActivityStep {
  text: string;
  stepType: ActivityStepTypes;
  mcqChoices?: string[];
}

export enum ActivityStepTypes {
  FREE_RESPONSE_QUESTION = "FREE_RESPONSE_QUESTION",
  MULTIPLE_CHOICE_QUESTIONS = "MULTIPLE_CHOICE_QUESTIONS",
  MESSAGE = "MESSAGE",
  SHOULD_INCLUDE_ESSAY = "SHOULD_INCLUDE_ESSAY",
}

export const ActivityStepType = new GraphQLObjectType({
  name: "ActivityStepType",
  fields: () => ({
    text: { type: GraphQLString },
    stepType: { type: GraphQLString },
    mcqChoices: { type: GraphQLList(GraphQLString) },
  }),
});

export const ActivityStepSchema = new Schema<ActivityStep>(
  {
    text: { type: String, required: true },
    stepType: { type: String, enum: ActivityStepTypes },
    mcqChoices: [{ type: String, required: false }],
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
  responsePendingMessage?: string;
  responseReadyMessage?: string;
  disabled?: boolean;
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

export const ActivityType = new GraphQLObjectType({
  name: "ActivityType",
  fields: () => ({
    _id: { type: GraphQLID },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    introduction: { type: GraphQLString },
    displayIcon: { type: GraphQLString },
    steps: { type: GraphQLList(ActivityStepType) },
    responsePendingMessage: { type: GraphQLString },
    responseReadyMessage: { type: GraphQLString },
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
  }),
});

export const ActivitySchema = new Schema(
  {
    title: { type: String },
    description: { type: String },
    introduction: { type: String },
    displayIcon: { type: String },
    disabled: { type: Boolean, default: false },
    responsePendingMessage: { type: String },
    responseReadyMessage: { type: String },
    steps: [{ type: ActivityStepSchema }],
    prompt: { type: mongoose.Types.ObjectId, ref: "Prompt" },
    prompts: [{ type: ActivityPromptSchema }],
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

export default mongoose.model<Activity>("Activity", ActivitySchema);
