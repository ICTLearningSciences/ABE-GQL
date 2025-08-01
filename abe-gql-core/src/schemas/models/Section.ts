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

export interface SectionAssignment {
  assignmentId: string;
  mandatory: boolean;
}

export interface Section extends Document {
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
    title: { type: GraphQLString },
    sectionCode: { type: GraphQLString },
    description: { type: GraphQLString },
    instructorId: { type: GraphQLID },
    assignments: { type: new GraphQLList(SectionAssignmentInputType) },
    numOptionalAssignmentsRequired: { type: GraphQLInt },
    deleted: { type: GraphQLBoolean },
  }),
});

export const SectionAssignmentSchema = new Schema<SectionAssignment>(
  {
    assignmentId: { type: String, required: true },
    mandatory: { type: Boolean, required: true },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

export const SectionSchema = new Schema<Section>(
  {
    title: { type: String, required: true },
    sectionCode: { type: String, required: true },
    description: { type: String, required: true },
    instructorId: { type: String, required: true },
    assignments: [SectionAssignmentSchema],
    numOptionalAssignmentsRequired: {
      type: Number,
      required: true,
      default: 0,
    },
    deleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

SectionSchema.index({ instructorId: 1 });
SectionSchema.index({ sectionCode: 1 });
SectionSchema.index({ title: 1 });

// eslint-disable-next-line   @typescript-eslint/no-explicit-any
SectionSchema.pre(/^find/, function(this: any) {
  this.where({ deleted: { $ne: true } });
});

export default mongoose.model<Section, Model<Section>>(
  "Section",
  SectionSchema
);
