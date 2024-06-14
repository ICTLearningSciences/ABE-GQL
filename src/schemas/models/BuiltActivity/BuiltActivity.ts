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
} from "graphql";
import {
  PaginatedResolveResult,
  PaginateOptions,
  PaginateQuery,
  pluginPagination,
} from "../Paginatation";
import { ActivityBuilderStepSchema, ActivityBuilderStepType, ActivityBuilderStepTypeInput } from "./objects";
import { ActivityBuilder } from "./types";

export const BuiltActivityType = new GraphQLObjectType({
    name: "ActivityType",
    fields: () => ({
        _id: { type: GraphQLID },
        activityType: { type: GraphQLString },
        title: { type: GraphQLString },
        description: { type: GraphQLString },
        displayIcon: { type: GraphQLString },
        newDocRecommend: { type: GraphQLBoolean },
        disabled: { type: GraphQLBoolean },
        // TODO: ensure that this allows for the other subtypes of ActivityBuilderStepType
        steps: { type: GraphQLList(ActivityBuilderStepType) },
    }),
});

export const BuiltActivityInputType = new GraphQLInputObjectType({
    name: "ActivityInputType",
    fields: () => ({
        _id: { type: GraphQLID },
        activityType: { type: GraphQLString },
        title: { type: GraphQLString },
        description: { type: GraphQLString },
        displayIcon: { type: GraphQLString },
        newDocRecommend: { type: GraphQLBoolean },
        disabled: { type: GraphQLBoolean },
        // TODO: ensure that this allows for the other subtypes of ActivityBuilderStepType
        steps: { type: GraphQLList(ActivityBuilderStepTypeInput) },
    }),
});



export const BuiltActivitySchema = new Schema(
    {
        title: { type: String },
        description: { type: String },
        displayIcon: { type: String },
        disabled: { type: Boolean, default: false },
        newDocRecommend: { type: Boolean },
        steps: [{ type: ActivityBuilderStepSchema }],
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

export default mongoose.model<ActivityBuilder, BuiltActivityModel>(
  "BuiltActivity",
  BuiltActivitySchema
);
