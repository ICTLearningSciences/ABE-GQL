/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Model } from "mongoose";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLBoolean,
} from "graphql";
import { validateIds } from "helpers";
import InstructorDataModel from "./InstructorData";
import SectionModel, { Section } from "./Section";

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructorId: string;
  sharedWithInstructors: string[];
  deleted: boolean;
}

export const CourseType = new GraphQLObjectType({
  name: "Course",
  fields: () => ({
    _id: { type: GraphQLID },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    instructorId: { type: GraphQLID },
    sharedWithInstructors: {
      type: new GraphQLList(GraphQLID),
    },
    sectionIds: {
      type: new GraphQLList(GraphQLID),
      resolve: async (course: Course) => {
        const sections = await SectionModel.find({ courseId: course._id });
        return sections.map((section: Section) => section._id.toString());
      },
    },
    deleted: { type: GraphQLBoolean },
  }),
});

export const CourseInputType = new GraphQLInputObjectType({
  name: "CourseInputType",
  fields: () => ({
    _id: { type: GraphQLID },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
  }),
});

export const CourseSchema = new Schema<Course>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    sharedWithInstructors: {
      type: [String],
      default: [],
      validate: {
        validator: async (instructorIds: string[]) => {
          return await validateIds(
            "userId",
            instructorIds,
            InstructorDataModel
          );
        },
      },
    },
    instructorId: {
      type: String,
      required: true,
      validate: {
        validator: async (instructorId: string) => {
          return await validateIds(
            "userId",
            [instructorId],
            InstructorDataModel
          );
        },
      },
    },
    deleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

CourseSchema.index({ instructorId: 1 });
CourseSchema.index({ title: 1 });

// eslint-disable-next-line   @typescript-eslint/no-explicit-any
CourseSchema.pre(/^find/, function (this: any) {
  this.where({ deleted: { $ne: true } });
});

export default mongoose.model<Course, Model<Course>>("Course", CourseSchema);
