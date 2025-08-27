/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Document, Model } from "mongoose";
import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLBoolean,
  GraphQLString,
} from "graphql";
import GoogleDocModel, { GoogleDocType } from "./GoogleDoc";

export interface RelevantGoogleDoc {
  docId: string;
  primaryDocument: boolean;
}

export interface ActivityCompletion {
  activityId: string;
  relevantGoogleDocs: RelevantGoogleDoc[];
  complete: boolean;
}

export interface AssignmentProgress {
  assignmentId: string;
  activityCompletions: ActivityCompletion[];
}

export interface StudentData extends Document {
  userId: string;
  name: string;
  enrolledCourses: string[];
  enrolledSections: string[];
  assignmentProgress: AssignmentProgress[];
  deleted: boolean;
}

export const RelevantGoogleDocType = new GraphQLObjectType({
  name: "RelevantGoogleDoc",
  fields: () => ({
    docId: { type: GraphQLString },
    primaryDocument: { type: GraphQLBoolean },
    docData: {
      type: GoogleDocType,
      resolve: async (doc: RelevantGoogleDoc) => {
        return await GoogleDocModel.findOne({ googleDocId: doc.docId });
      },
    },
  }),
});

export const RelevantGoogleDocInputType = new GraphQLInputObjectType({
  name: "RelevantGoogleDocInputType",
  fields: () => ({
    docId: { type: GraphQLString },
    primaryDocument: { type: GraphQLBoolean },
  }),
});

export const ActivityCompletionType = new GraphQLObjectType({
  name: "ActivityCompletion",
  fields: () => ({
    activityId: { type: GraphQLID },
    relevantGoogleDocs: { type: new GraphQLList(RelevantGoogleDocType) },
    complete: { type: GraphQLBoolean },
  }),
});

export const AssignmentProgressType = new GraphQLObjectType({
  name: "AssignmentProgress",
  fields: () => ({
    assignmentId: { type: GraphQLID },
    activityCompletions: { type: new GraphQLList(ActivityCompletionType) },
  }),
});

export const ActivityCompletionInputType = new GraphQLInputObjectType({
  name: "ActivityCompletionInputType",
  fields: () => ({
    activityId: { type: GraphQLID },
    relevantGoogleDocs: { type: new GraphQLList(RelevantGoogleDocInputType) },
    complete: { type: GraphQLBoolean },
  }),
});

export const AssignmentProgressInputType = new GraphQLInputObjectType({
  name: "AssignmentProgressInputType",
  fields: () => ({
    assignmentId: { type: GraphQLID },
    activityCompletions: { type: new GraphQLList(ActivityCompletionInputType) },
  }),
});

export const StudentDataType = new GraphQLObjectType({
  name: "StudentData",
  fields: () => ({
    _id: { type: GraphQLID },
    userId: { type: GraphQLID },
    name: { type: GraphQLString },
    enrolledCourses: { type: new GraphQLList(GraphQLID) },
    enrolledSections: { type: new GraphQLList(GraphQLID) },
    assignmentProgress: { type: new GraphQLList(AssignmentProgressType) },
    deleted: { type: GraphQLBoolean },
  }),
});

export const StudentDataInputType = new GraphQLInputObjectType({
  name: "StudentDataInputType",
  fields: () => ({
    userId: { type: GraphQLID },
    name: { type: GraphQLString },
    enrolledCourses: { type: new GraphQLList(GraphQLID) },
    enrolledSections: { type: new GraphQLList(GraphQLID) },
    assignmentProgress: { type: new GraphQLList(AssignmentProgressInputType) },
    deleted: { type: GraphQLBoolean },
  }),
});

export const RelevantGoogleDocSchema = new Schema<RelevantGoogleDoc>(
  {
    docId: { type: String, required: true },
    primaryDocument: { type: Boolean, required: true, default: false },
  },
  { timestamps: false, _id: false, collation: { locale: "en", strength: 2 } }
);

export const ActivityCompletionSchema = new Schema<ActivityCompletion>(
  {
    activityId: { type: String, required: true },
    complete: { type: Boolean, required: true, default: false },
    relevantGoogleDocs: { type: [RelevantGoogleDocSchema], default: [] },
  },
  { timestamps: false, _id: false, collation: { locale: "en", strength: 2 } }
);

export const AssignmentProgressSchema = new Schema<AssignmentProgress>(
  {
    assignmentId: { type: String, required: true },
    activityCompletions: { type: [ActivityCompletionSchema], default: [] },
  },
  { timestamps: false, _id: false, collation: { locale: "en", strength: 2 } }
);

export const StudentDataSchema = new Schema<StudentData>(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String },
    enrolledCourses: { type: [String], default: [] },
    enrolledSections: { type: [String], default: [] },
    assignmentProgress: { type: [AssignmentProgressSchema], default: [] },
    deleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

StudentDataSchema.index({ userId: 1 });

// eslint-disable-next-line   @typescript-eslint/no-explicit-any
StudentDataSchema.pre(/^find/, function (this: any) {
  this.where({ deleted: { $ne: true } });
});

export default mongoose.model<StudentData, Model<StudentData>>(
  "StudentData",
  StudentDataSchema
);
