/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose from "mongoose";
import { BuiltActivitySchema, BuiltActivityType } from "./BuiltActivity";
import { ActivityBuilder } from "./types";
import {
  PaginateQuery,
  PaginateOptions,
  PaginatedResolveResult,
  pluginPagination,
} from "../Paginatation";
import { GraphQLObjectType, GraphQLString } from "graphql";

export const ActivityVersionType = new GraphQLObjectType({
  name: "ActivityVersionType",
  fields: {
    activity: { type: BuiltActivityType },
    versionTime: { type: GraphQLString },
  },
});

export const ActivityVersionSchema = new mongoose.Schema({
  activity: BuiltActivitySchema,
  versionTime: {
    type: String,
    required: true,
  },
});

export interface ActivityVersion {
  activity: ActivityBuilder;
  versionTime: string;
}

export interface ActivityVersionModel extends mongoose.Model<ActivityVersion> {
  paginate(
    query?: PaginateQuery<ActivityVersion>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<ActivityVersion>>;
}

pluginPagination(ActivityVersionSchema);

export default mongoose.model<ActivityVersion, ActivityVersionModel>(
  "BuiltActivityVersion",
  ActivityVersionSchema
);
