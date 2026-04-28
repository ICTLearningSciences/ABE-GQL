/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Model, Schema } from "mongoose";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
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

export interface RagConfig {
  includeRag: boolean;
  ragMetadataFilter: Record<string, string | string[]>;
}

export interface Panel {
  clientId: string;
  panelName: string;
  panelDescription: string;
  panelists: string[];
  ragConfig: RagConfig;
  deleted: boolean;
}

const RagConfigObjectType = new GraphQLObjectType({
  name: "PanelRagConfigType",
  fields: () => ({
    includeRag: { type: GraphQLBoolean },
    ragMetadataFilter: { type: ObjectType },
  }),
});

const RagConfigInputType = new GraphQLInputObjectType({
  name: "PanelRagConfigInputType",
  fields: () => ({
    includeRag: { type: GraphQLBoolean },
    ragMetadataFilter: { type: ObjectType },
  }),
});

export const PanelType = new GraphQLObjectType({
  name: "PanelType",
  fields: () => ({
    clientId: { type: GraphQLString },
    panelName: { type: GraphQLString },
    panelDescription: { type: GraphQLString },
    panelists: { type: new GraphQLList(GraphQLString) },
    ragConfig: { type: RagConfigObjectType },
  }),
});

export const PanelInputType = new GraphQLInputObjectType({
  name: "PanelInputType",
  fields: () => ({
    clientId: { type: GraphQLString },
    panelName: { type: GraphQLString },
    panelDescription: { type: GraphQLString },
    panelists: { type: new GraphQLList(GraphQLString) },
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

export const PanelSchema = new Schema(
  {
    clientId: { type: String, required: true, unique: true },
    panelName: { type: String },
    panelDescription: { type: String },
    panelists: [{ type: String }],
    ragConfig: { type: RagConfigSchema, default: () => ({}) },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collation: { locale: "en", strength: 2 },
  }
);

PanelSchema.index({ clientId: 1 });

export interface PanelModel extends Model<Panel> {
  paginate(
    query?: PaginateQuery<Panel>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<Panel>>;
}

pluginPagination(PanelSchema);

export default mongoose.model<Panel, PanelModel>("Panel", PanelSchema);
