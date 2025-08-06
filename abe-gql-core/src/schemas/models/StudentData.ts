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

export interface AssignmentProgress {
  assignmentId: string;
  complete: boolean;
}

export interface StudentData extends Document {
  userId: string;
  name: string;
  enrolledCourses: string[];
  enrolledSections: string[];
  assignmentProgress: AssignmentProgress[];
  deleted: boolean;
}

export const AssignmentProgressType = new GraphQLObjectType({
  name: "AssignmentProgress",
  fields: () => ({
    assignmentId: { type: GraphQLID },
    complete: { type: GraphQLBoolean },
  }),
});

export const AssignmentProgressInputType = new GraphQLInputObjectType({
  name: "AssignmentProgressInputType",
  fields: () => ({
    assignmentId: { type: GraphQLID },
    complete: { type: GraphQLBoolean },
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

export const AssignmentProgressSchema = new Schema<AssignmentProgress>(
  {
    assignmentId: { type: String, required: true },
    complete: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
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
