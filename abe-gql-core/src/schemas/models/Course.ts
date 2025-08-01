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

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructorId: string;
  sectionIds: string[];
  deleted: boolean;
}

export const CourseType = new GraphQLObjectType({
  name: "Course",
  fields: () => ({
    _id: { type: GraphQLID },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    instructorId: { type: GraphQLID },
    sectionIds: { type: new GraphQLList(GraphQLID) },
    deleted: { type: GraphQLBoolean },
  }),
});

export const CourseInputType = new GraphQLInputObjectType({
  name: "CourseInputType",
  fields: () => ({
    _id: { type: GraphQLID },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    instructorId: { type: GraphQLID },
    sectionIds: { type: new GraphQLList(GraphQLID) },
    deleted: { type: GraphQLBoolean },
  }),
});

export const CourseSchema = new Schema<Course>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructorId: { type: String, required: true },
    sectionIds: [{ type: String, required: true }],
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
