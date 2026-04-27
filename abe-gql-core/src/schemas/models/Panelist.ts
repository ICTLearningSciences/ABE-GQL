/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
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
import { DateType } from "../types/date";
import { ObjectType } from "../types/object";
import {
  PaginateOptions,
  PaginateQuery,
  PaginatedResolveResult,
  pluginPagination,
} from "./Paginatation";

export interface RagConfig {
  includeRag: boolean;
  ragMetadataFilter: Record<string, string | string[]>;
}

export interface Panelist {
  clientId: string;
  promptSegment: string;
  roleSegment: string;
  profilePicture: string;
  panelistName: string;
  panelistDescription: string;
  introductionMessage: string;
  ragConfig: RagConfig;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RagConfigObjectType = new GraphQLObjectType({
  name: "RagConfigType",
  fields: () => ({
    includeRag: { type: GraphQLBoolean },
    ragMetadataFilter: { type: ObjectType },
  }),
});

const RagConfigInputType = new GraphQLInputObjectType({
  name: "RagConfigInputType",
  fields: () => ({
    includeRag: { type: GraphQLBoolean },
    ragMetadataFilter: { type: ObjectType },
  }),
});

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
    ragConfig: { type: RagConfigObjectType },
    deleted: { type: GraphQLBoolean },
    createdAt: { type: DateType },
    updatedAt: { type: DateType },
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
    ragConfig: { type: RagConfigInputType },
  }),
});

const RagConfigSchema = new Schema(
  {
    includeRag: { type: Boolean, default: false },
    ragMetadataFilter: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

export const PanelistSchema = new Schema(
  {
    clientId: { type: String, required: true, unique: true },
    promptSegment: { type: String },
    roleSegment: { type: String },
    profilePicture: { type: String },
    panelistName: { type: String },
    panelistDescription: { type: String },
    introductionMessage: { type: String },
    ragConfig: { type: RagConfigSchema, default: () => ({}) },
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

export default mongoose.model<Panelist, PanelistModel>(
  "Panelist",
  PanelistSchema
);
