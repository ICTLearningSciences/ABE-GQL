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
} from "graphql";

export interface EnrolledSection {
  sectionId: string;
  completedAssignmentIds: string[];
}

export interface EnrolledCourse {
  courseId: string;
  enrolledSections: EnrolledSection[];
}

export interface StudentData extends Document {
  userId: string;
  enrolledCourses: EnrolledCourse[];
}

export const EnrolledSectionType = new GraphQLObjectType({
  name: "EnrolledSection",
  fields: () => ({
    sectionId: { type: GraphQLID },
    completedAssignmentIds: { type: new GraphQLList(GraphQLID) },
  }),
});

export const EnrolledSectionInputType = new GraphQLInputObjectType({
  name: "EnrolledSectionInputType",
  fields: () => ({
    sectionId: { type: GraphQLID },
    completedAssignmentIds: { type: new GraphQLList(GraphQLID) },
  }),
});

export const EnrolledCourseType = new GraphQLObjectType({
  name: "EnrolledCourse",
  fields: () => ({
    courseId: { type: GraphQLID },
    enrolledSections: { type: new GraphQLList(EnrolledSectionType) },
  }),
});

export const EnrolledCourseInputType = new GraphQLInputObjectType({
  name: "EnrolledCourseInputType",
  fields: () => ({
    courseId: { type: GraphQLID },
    enrolledSections: { type: new GraphQLList(EnrolledSectionInputType) },
  }),
});

export const StudentDataType = new GraphQLObjectType({
  name: "StudentData",
  fields: () => ({
    _id: { type: GraphQLID },
    userId: { type: GraphQLID },
    enrolledCourses: { type: new GraphQLList(EnrolledCourseType) },
  }),
});

export const StudentDataInputType = new GraphQLInputObjectType({
  name: "StudentDataInputType",
  fields: () => ({
    userId: { type: GraphQLID },
    enrolledCourses: { type: new GraphQLList(EnrolledCourseInputType) },
  }),
});

export const EnrolledSectionSchema = new Schema<EnrolledSection>(
  {
    sectionId: { type: String, required: true },
    completedAssignmentIds: [{ type: String, default: [] }],
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

export const EnrolledCourseSchema = new Schema<EnrolledCourse>(
  {
    courseId: { type: String, required: true },
    enrolledSections: [{ type: EnrolledSectionSchema, default: [] }],
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

export const StudentDataSchema = new Schema<StudentData>(
  {
    userId: { type: String, required: true, unique: true },
    enrolledCourses: [{ type: EnrolledCourseSchema, default: [] }],
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

StudentDataSchema.index({ userId: 1 });

export default mongoose.model<StudentData, Model<StudentData>>(
  "StudentData",
  StudentDataSchema
);
