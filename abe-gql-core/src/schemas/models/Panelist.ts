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
