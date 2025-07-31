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
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
} from "graphql";

export interface CourseAssignment {
  assignmentId: string;
  mandatory: boolean;
}

export interface Course extends Document {
  title: string;
  courseCode: string;
  description: string;
  instructorId: string;
  assignments: CourseAssignment[];
  numOptionalAssignmentsRequired: number;
}

export const CourseAssignmentType = new GraphQLObjectType({
  name: "CourseAssignment",
  fields: () => ({
    assignmentId: { type: GraphQLID },
    mandatory: { type: GraphQLBoolean },
  }),
});

export const CourseAssignmentInputType = new GraphQLInputObjectType({
  name: "CourseAssignmentInputType",
  fields: () => ({
    assignmentId: { type: GraphQLID },
    mandatory: { type: GraphQLBoolean },
  }),
});

export const CourseType = new GraphQLObjectType({
  name: "Course",
  fields: () => ({
    _id: { type: GraphQLID },
    title: { type: GraphQLString },
    courseCode: { type: GraphQLString },
    description: { type: GraphQLString },
    instructorId: { type: GraphQLID },
    assignments: { type: new GraphQLList(CourseAssignmentType) },
    numOptionalAssignmentsRequired: { type: GraphQLInt },
  }),
});

export const CourseInputType = new GraphQLInputObjectType({
  name: "CourseInputType",
  fields: () => ({
    title: { type: GraphQLString },
    courseCode: { type: GraphQLString },
    description: { type: GraphQLString },
    instructorId: { type: GraphQLID },
    assignments: { type: new GraphQLList(CourseAssignmentInputType) },
    numOptionalAssignmentsRequired: { type: GraphQLInt },
  }),
});

export const CourseAssignmentSchema = new Schema<CourseAssignment>(
  {
    assignmentId: { type: String, required: true },
    mandatory: { type: Boolean, required: true },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

export const CourseSchema = new Schema<Course>(
  {
    title: { type: String, required: true },
    courseCode: { type: String, required: true },
    description: { type: String, required: true },
    instructorId: { type: String, required: true },
    assignments: [CourseAssignmentSchema],
    numOptionalAssignmentsRequired: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

CourseSchema.index({ instructorId: 1 });
CourseSchema.index({ courseCode: 1 });
CourseSchema.index({ title: 1 });

export default mongoose.model<Course, Model<Course>>("Course", CourseSchema);
