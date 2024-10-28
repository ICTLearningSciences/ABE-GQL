/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Model, Schema } from "mongoose";
import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLBoolean,
  GraphQLUnionType,
} from "graphql";
import {
  PaginatedResolveResult,
  PaginateOptions,
  PaginateQuery,
  pluginPagination,
} from "../Paginatation";
import {
  ActivityBuilderStepUnionSchema,
  PromptActivityStepType,
  RequestUserInputActivityStepType,
  SystemMessageActivityStepType,
  PromptActivityStepTypeInput,
  RequestUserInputActivityStepTypeInput,
  SystemMessageActivityStepTypeInput,
  SystemMessageActivityStepSchema,
  RequestUserInputActivityStepSchema,
  PromptActivityStepSchema,
  ConditionalActivityStepType,
  ConditionalActivityStepTypeInput,
} from "./objects";
import { ActivityBuilder, ActivityBuilderStepType } from "./types";

export enum BuiltActivityVisibility {
  PRIVATE = "private",
  READ_ONLY = "read-only",
  EDITABLE = "editable",
}

// union the different step types
export const ActivityBuilderStepTypeUnion = new GraphQLUnionType({
  name: "ActivityBuilderStepTypeUnion",
  types: [
    PromptActivityStepType,
    RequestUserInputActivityStepType,
    SystemMessageActivityStepType,
    ConditionalActivityStepType,
  ],
  resolveType(value) {
    switch (value.stepType) {
      case ActivityBuilderStepType.PROMPT:
        return PromptActivityStepType;
      case ActivityBuilderStepType.REQUEST_USER_INPUT:
        return RequestUserInputActivityStepType;
      case ActivityBuilderStepType.SYSTEM_MESSAGE:
        return SystemMessageActivityStepType;
      case ActivityBuilderStepType.CONDITIONAL:
        return ConditionalActivityStepType;
      default:
        throw new Error("invalid step type");
    }
  },
});

export const StepsFlowType = new GraphQLObjectType({
  name: "StepsFlowType",
  fields: () => ({
    clientId: { type: GraphQLString },
    steps: { type: GraphQLList(ActivityBuilderStepTypeUnion) },
    name: { type: GraphQLString },
  }),
});

export const StepsFlowInputType = new GraphQLInputObjectType({
  name: "StepsFlowInputType",
  fields: () => ({
    clientId: { type: GraphQLString },
    steps: { type: GraphQLList(ActivityBuilderStepTypeInputUnion) },
    name: { type: GraphQLString },
  }),
});

export const StepsFlowSchema = new Schema(
  {
    name: { type: String },
    clientId: { type: String },
    steps: [ActivityBuilderStepUnionSchema],
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

export const ActivityBuilderStepTypeInputUnion = new GraphQLInputObjectType({
  name: "ActivityBuilderStepTypeInputUnion",
  fields: {
    ...PromptActivityStepTypeInput.getFields(),
    ...RequestUserInputActivityStepTypeInput.getFields(),
    ...SystemMessageActivityStepTypeInput.getFields(),
    ...ConditionalActivityStepTypeInput.getFields(),
  },
});

export const BuiltActivityType = new GraphQLObjectType({
  name: "BuiltActivityType",
  fields: () => ({
    _id: { type: GraphQLID },
    clientId: { type: GraphQLString },
    activityType: { type: GraphQLString },
    user: { type: GraphQLString },
    visibility: { type: GraphQLString },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    displayIcon: { type: GraphQLString },
    newDocRecommend: { type: GraphQLBoolean },
    disabled: { type: GraphQLBoolean },
    flowsList: { type: GraphQLList(StepsFlowType) },
  }),
});

export const BuiltActivityInputType = new GraphQLInputObjectType({
  name: "BuiltActivityInputType",
  fields: () => ({
    _id: { type: GraphQLID },
    activityType: { type: GraphQLString },
    clientId: { type: GraphQLString },
    user: { type: GraphQLString },
    visibility: { type: GraphQLString },
    deleted: { type: GraphQLBoolean },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    displayIcon: { type: GraphQLString },
    newDocRecommend: { type: GraphQLBoolean },
    disabled: { type: GraphQLBoolean },
    // TODO: ensure that this allows for the other subtypes of ActivityBuilderStepType
    flowsList: { type: GraphQLList(StepsFlowInputType) },
  }),
});

export const BuiltActivitySchema = new Schema(
  {
    title: { type: String },
    user: { type: String },
    clientId: { type: String },
    deleted: { type: Boolean, default: false },
    visibility: {
      type: String,
      default: BuiltActivityVisibility.READ_ONLY,
    },
    activityType: { type: String },
    description: { type: String },
    displayIcon: { type: String },
    disabled: { type: Boolean, default: false },
    newDocRecommend: { type: Boolean, default: false },
    flowsList: [StepsFlowSchema],
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

export interface BuiltActivityModel extends Model<ActivityBuilder> {
  paginate(
    query?: PaginateQuery<ActivityBuilder>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<ActivityBuilder>>;
}

pluginPagination(BuiltActivitySchema);

const ActivityBuilderModel = mongoose.model<
  ActivityBuilder,
  BuiltActivityModel
>("BuiltActivity", BuiltActivitySchema);

ActivityBuilderModel.discriminator(
  ActivityBuilderStepType.SYSTEM_MESSAGE,
  SystemMessageActivityStepSchema
);

ActivityBuilderModel.discriminator(
  ActivityBuilderStepType.REQUEST_USER_INPUT,
  RequestUserInputActivityStepSchema
);

ActivityBuilderModel.discriminator("PromptStep", PromptActivityStepSchema);

export default ActivityBuilderModel;
