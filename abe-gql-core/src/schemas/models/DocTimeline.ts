/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema } from "mongoose";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLList,
} from "graphql";
import { DateType } from "../types/date";
import {
  GDocVersionObjectType,
  GDocVersionSchema,
  IGDocVersion,
} from "./GoogleDocVersion";

export enum TimelinePointType {
  START = "START",
  NEW_ACTIVITY = "NEW_ACTIVITY",
  TIME_DIFFERENCE = "TIME_DIFFERENCE",
  MOST_RECENT = "MOST_RECENT",
  NONE = "",
}

export enum AiGenerationStatus {
  NONE = "NONE",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface TimelinePoint {
  type: TimelinePointType;
  versionTime: string;
  version: IGDocVersion;
  versionId: string;
  intent: string;
  changeSummaryStatus: AiGenerationStatus;
  changeSummary: string;
  userInputSummary: string;
  reverseOutline: string;
  reverseOutlineStatus: AiGenerationStatus;
  relatedFeedback: string;
}

export const TimelinePointObjectType = new GraphQLObjectType({
  name: "TimelinePointObjectType",
  fields: () => ({
    type: { type: GraphQLString },
    versionTime: { type: GraphQLString },
    version: { type: GDocVersionObjectType },
    versionId: {
      type: GraphQLString,
      resolve: (source: TimelinePoint) =>
        source.versionId || source.version._id,
    },
    intent: { type: GraphQLString },
    changeSummaryStatus: { type: GraphQLString },
    changeSummary: { type: GraphQLString },
    userInputSummary: { type: GraphQLString },
    reverseOutline: { type: GraphQLString },
    reverseOutlineStatus: { type: GraphQLString },
    relatedFeedback: { type: GraphQLString },
  }),
});

export const TimelinePointInputType = new GraphQLInputObjectType({
  name: "TimelinePointInputType",
  fields: () => ({
    type: { type: GraphQLString },
    versionTime: { type: GraphQLString },
    versionId: { type: GraphQLString },
    intent: { type: GraphQLString },
    changeSummary: { type: GraphQLString },
    changeSummaryStatus: { type: GraphQLString },
    userInputSummary: { type: GraphQLString },
    reverseOutline: { type: GraphQLString },
    reverseOutlineStatus: { type: GraphQLString },
    relatedFeedback: { type: GraphQLString },
  }),
});

export const TimelinePointSchema = new Schema<TimelinePoint>(
  {
    type: { type: String },
    versionTime: { type: String },
    version: { type: GDocVersionSchema },
    versionId: { type: String },
    intent: { type: String },
    changeSummaryStatus: {
      type: String,
      enum: AiGenerationStatus,
      default: AiGenerationStatus.COMPLETED, // backwards compatibility
    },
    changeSummary: { type: String },
    userInputSummary: { type: String },
    reverseOutline: { type: String },
    reverseOutlineStatus: {
      type: String,
      enum: AiGenerationStatus,
      default: AiGenerationStatus.COMPLETED, // backwards compatibility
    },
    relatedFeedback: { type: String },
  },
  { timestamps: true }
);

export interface DocTimeline {
  docId: string;
  user: string;
  timelinePoints: TimelinePoint[];
}

export const DocTimelineType = new GraphQLObjectType({
  name: "DocTimelineType",
  fields: () => ({
    docId: { type: GraphQLString },
    user: { type: GraphQLString },
    timelinePoints: { type: GraphQLList(TimelinePointObjectType) },
    createdAt: { type: DateType },
  }),
});

export const DocTimelineInputType = new GraphQLInputObjectType({
  name: "DocTimelineInputType",
  fields: () => ({
    docId: { type: GraphQLString },
    user: { type: GraphQLString },
    timelinePoints: { type: GraphQLList(TimelinePointInputType) },
  }),
});

export const DocTimelineSchema = new Schema(
  {
    docId: { type: String, required: true },
    user: { type: String, required: true },
    timelinePoints: [{ type: TimelinePointSchema }],
  },
  { timestamps: true }
);

export default mongoose.model<DocTimeline>("DocTimeline", DocTimelineSchema);
