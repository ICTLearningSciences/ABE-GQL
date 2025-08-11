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
  GraphQLInt,
} from "graphql";
import { validateIds } from "helpers";
import AssignmentModel from "./Assignment";
import InstructorDataModel from "./InstructorData";

export interface SectionAssignment {
  assignmentId: string;
  mandatory: boolean;
}

export interface Section {
  _id: string;
  title: string;
  sectionCode: string;
  description: string;
  instructorId: string;
  assignments: SectionAssignment[];
  numOptionalAssignmentsRequired: number;
  deleted: boolean;
}

export const SectionAssignmentType = new GraphQLObjectType({
  name: "SectionAssignment",
  fields: () => ({
    assignmentId: { type: GraphQLID },
    mandatory: { type: GraphQLBoolean },
  }),
});

export const SectionAssignmentInputType = new GraphQLInputObjectType({
  name: "SectionAssignmentInputType",
  fields: () => ({
    assignmentId: { type: GraphQLID },
    mandatory: { type: GraphQLBoolean },
  }),
});

export const SectionType = new GraphQLObjectType({
  name: "Section",
  fields: () => ({
    _id: { type: GraphQLID },
    title: { type: GraphQLString },
    sectionCode: { type: GraphQLString },
    description: { type: GraphQLString },
    instructorId: { type: GraphQLID },
    assignments: { type: new GraphQLList(SectionAssignmentType) },
    numOptionalAssignmentsRequired: { type: GraphQLInt },
    deleted: { type: GraphQLBoolean },
  }),
});

export const SectionInputType = new GraphQLInputObjectType({
  name: "SectionInputType",
  fields: () => ({
    _id: { type: GraphQLID },
    title: { type: GraphQLString },
    sectionCode: { type: GraphQLString },
    description: { type: GraphQLString },
    assignments: { type: new GraphQLList(SectionAssignmentInputType) },
    numOptionalAssignmentsRequired: { type: GraphQLInt },
  }),
});

export const SectionAssignmentSchema = new Schema<SectionAssignment>({
  assignmentId: { type: String, required: true },
  mandatory: { type: Boolean, required: true },
});

export const SectionSchema = new Schema<Section>(
  {
    title: { type: String, default: "" },
    sectionCode: { type: String, default: "" },
    description: { type: String, default: "" },
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
    assignments: {
      type: [SectionAssignmentSchema],
      default: [],
      validate: {
        validator: async (assignments: SectionAssignment[]) => {
          const assignmentIds = assignments.map((a) => a.assignmentId);
          return await validateIds("_id", assignmentIds, AssignmentModel);
        },
      },
    },
    numOptionalAssignmentsRequired: {
      type: Number,
      default: 0,
    },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

SectionSchema.index({ instructorId: 1 });
SectionSchema.index({ sectionCode: 1 });
SectionSchema.index({ title: 1 });

// eslint-disable-next-line   @typescript-eslint/no-explicit-any
SectionSchema.pre(/^find/, function (this: any) {
  this.where({ deleted: { $ne: true } });
});

export default mongoose.model<Section, Model<Section>>(
  "Section",
  SectionSchema
);
