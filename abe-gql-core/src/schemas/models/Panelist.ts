/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Model, Schema } from "mongoose";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLInputObjectType,
} from "graphql";
import { ObjectType } from "../types/object";
import {
  PaginateOptions,
  PaginateQuery,
  PaginatedResolveResult,
  pluginPagination,
} from "./Paginatation";
import { RagStoreConfiguration } from "./BuiltActivity/types";
import {
  RagStoreConfigurationInputType,
  RagStoreConfigurationSchema,
  RagStoreConfigurationType,
} from "./BuiltActivity/objects";

export interface Panelist {
  clientId: string;
  promptSegment: string;
  roleSegment: string;
  profilePicture: string;
  panelistName: string;
  panelistDescription: string;
  introductionMessage: string;
  ragConfig: RagStoreConfiguration;
  deleted: boolean;
}

export const PanelistType = new GraphQLObjectType({
  name: "PanelistType",
  fields: () => ({
    clientId: { type: GraphQLString },
    promptSegment: { type: GraphQLString },
    roleSegment: { type: GraphQLString },
    profilePicture: { type: GraphQLString },
    panelistName: { type: GraphQLString },
    panelistDescription: { type: GraphQLString },
    introductionMessage: { type: GraphQLString },
    ragConfig: { type: RagStoreConfigurationType },
    deleted: { type: GraphQLBoolean },
  }),
});

export const PanelistInputType = new GraphQLInputObjectType({
  name: "PanelistInputType",
  fields: () => ({
    clientId: { type: GraphQLString },
    promptSegment: { type: GraphQLString },
    roleSegment: { type: GraphQLString },
    profilePicture: { type: GraphQLString },
    panelistName: { type: GraphQLString },
    panelistDescription: { type: GraphQLString },
    introductionMessage: { type: GraphQLString },
    ragConfig: { type: RagStoreConfigurationInputType },
  }),
});

export const PanelistSchema = new Schema(
  {
    clientId: { type: String, required: true, unique: true },
    promptSegment: { type: String },
    roleSegment: { type: String },
    profilePicture: { type: String },
    panelistName: { type: String },
    panelistDescription: { type: String },
    introductionMessage: { type: String },
    ragConfig: { type: RagStoreConfigurationSchema, required: false },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collation: { locale: "en", strength: 2 },
  }
);

PanelistSchema.index({ clientId: 1 });

export interface PanelistModel extends Model<Panelist> {
  paginate(
    query?: PaginateQuery<Panelist>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<Panelist>>;
}

pluginPagination(PanelistSchema);

// eslint-disable-next-line   @typescript-eslint/no-explicit-any
PanelistSchema.pre(/^find/, function (this: any) {
  this.where({ deleted: { $ne: true } });
});

export default mongoose.model<Panelist, PanelistModel>(
  "Panelist",
  PanelistSchema
);
