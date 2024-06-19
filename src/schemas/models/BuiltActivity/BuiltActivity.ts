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
} from "./objects";
import { ActivityBuilder } from "./types";

// union the different step types
export const ActivityBuilderStepTypeUnion = new GraphQLUnionType({
  name: "ActivityBuilderStepTypeUnion",
  types: [
    PromptActivityStepType,
    RequestUserInputActivityStepType,
    SystemMessageActivityStepType,
  ],
  resolveType(value) {
    switch (value.stepType) {
      case "Prompt":
        return PromptActivityStepType;
      case "RequestUserInput":
        return RequestUserInputActivityStepType;
      case "SystemMessage":
        return SystemMessageActivityStepType;
      default:
        throw new Error("invalid step type");
    }
  },
});

export const StepsFlowType = new GraphQLObjectType({
  name: "StepsFlowType",
  fields: () => ({
    _id: { type: GraphQLID },
    steps: { type: GraphQLList(ActivityBuilderStepTypeUnion) },
    name: { type: GraphQLString },
  }),
});

export const StepsFlowInputType = new GraphQLInputObjectType({
  name: "StepsFlowInputType",
  fields: () => ({
    _id: { type: GraphQLID },
    steps: { type: GraphQLList(ActivityBuilderStepTypeInputUnion) },
    name: { type: GraphQLString },
  }),
});

export const StepsFlowSchema = new Schema(
  {
    name: { type: String },
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
  },
});

export const BuiltActivityType = new GraphQLObjectType({
  name: "BuiltActivityType",
  fields: () => ({
    _id: { type: GraphQLID },
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
    user: { type: GraphQLString },
    visibility: { type: GraphQLString },
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
    visibility: { type: String },
    activityType: { type: String },
    description: { type: String },
    displayIcon: { type: String },
    disabled: { type: Boolean, default: false },
    newDocRecommend: { type: Boolean },
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
  "SystemMessage",
  SystemMessageActivityStepSchema
);

ActivityBuilderModel.discriminator(
  "RequestUserInput",
  RequestUserInputActivityStepSchema
);

ActivityBuilderModel.discriminator("PromptStep", PromptActivityStepSchema);

export default ActivityBuilderModel;
