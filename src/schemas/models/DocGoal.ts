/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Document, Model } from "mongoose";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLID,
  GraphQLBoolean,
  GraphQLList,
} from "graphql";
import {
  PaginatedResolveResult,
  PaginateOptions,
  PaginateQuery,
  pluginPagination,
} from "./Paginatation";
import { DisplayIcons } from "../../constants";

export interface DocGoal extends Document {
  activities: string[];
  activityOrder: string[];
  title: string;
  description: string;
  displayIcon: DisplayIcons;
  introduction: string;
  newDocRecommend?: boolean;
}

export const DocGoalType = new GraphQLObjectType({
  name: "DocGoalType",
  fields: () => ({
    _id: { type: GraphQLID },
    activities: {
      type: GraphQLList(GraphQLID),
    },
    activityOrder: { type: GraphQLList(GraphQLID) },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    displayIcon: { type: GraphQLString },
    introduction: { type: GraphQLString },
    newDocRecommend: { type: GraphQLBoolean },
  }),
});

export const DocGoalSchema = new Schema<DocGoal, DocGoalModel>(
  {
    activities: [
      { type: mongoose.Types.ObjectId, ref: "Activity", default: [] },
    ],
    activityOrder: [
      { type: mongoose.Types.ObjectId, ref: "Activity", default: [] },
    ],
    title: { type: String, required: true },
    description: { type: String },
    displayIcon: { type: String, enum: DisplayIcons },
    introduction: { type: String },
    newDocRecommend: { type: Boolean },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

export interface DocGoalModel extends Model<DocGoal> {
  paginate(
    query?: PaginateQuery<DocGoal>,
    options?: PaginateOptions
  ): Promise<PaginatedResolveResult<DocGoal>>;
}

pluginPagination(DocGoalSchema);

export default mongoose.model<DocGoal, DocGoalModel>("DocGoal", DocGoalSchema);
