/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Schema, Document, Model } from "mongoose";
import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLList,
  GraphQLBoolean,
  GraphQLString,
  GraphQLInt,
} from "graphql";
import GoogleDocModel, { GoogleDocType } from "./GoogleDoc";
import {
  AiModelService,
  AiModelServiceSchema,
  AiModelServiceType,
} from "./Config";

export interface RelevantGoogleDoc {
  docId: string;
  primaryDocument: boolean;
}

export interface InstructorGrade {
  grade: number;
  comment: string;
}

export interface ActivityCompletion {
  activityId: string;
  complete: boolean;
  defaultLLM?: AiModelService;
}

export interface AssignmentProgress {
  assignmentId: string;
  activityCompletions: ActivityCompletion[];
  relevantGoogleDocs: RelevantGoogleDoc[];
  instructorGrade?: InstructorGrade;
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

export const ActivityCompletionType = new GraphQLObjectType({
  name: "ActivityCompletion",
  fields: () => ({
    activityId: { type: GraphQLID },
    complete: { type: GraphQLBoolean },
    defaultLLM: { type: AiModelServiceType },
  }),
});

export const AssignmentProgressType = new GraphQLObjectType({
  name: "AssignmentProgress",
  fields: () => ({
    assignmentId: { type: GraphQLID },
    activityCompletions: { type: new GraphQLList(ActivityCompletionType) },
    relevantGoogleDocs: { type: new GraphQLList(RelevantGoogleDocType) },
    instructorGrade: {
      type: new GraphQLObjectType({
        name: "InstructorGrade",
        fields: () => ({
          grade: { type: GraphQLInt },
          comment: { type: GraphQLString },
        }),
      }),
    },
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

export const RelevantGoogleDocSchema = new Schema<RelevantGoogleDoc>(
  {
    docId: { type: String, required: true },
    primaryDocument: { type: Boolean, required: true, default: false },
  },
  { timestamps: false, _id: false, collation: { locale: "en", strength: 2 } }
);

export const InstructorGradeSchema = new Schema<InstructorGrade>(
  {
    grade: { type: Number, required: true },
    comment: { type: String, required: true },
  },
  { timestamps: false, _id: false, collation: { locale: "en", strength: 2 } }
);

export const ActivityCompletionSchema = new Schema<ActivityCompletion>(
  {
    activityId: { type: String, required: true },
    complete: { type: Boolean, required: true, default: false },
    defaultLLM: { type: AiModelServiceSchema },
  },
  { timestamps: false, _id: false, collation: { locale: "en", strength: 2 } }
);

export const AssignmentProgressSchema = new Schema<AssignmentProgress>(
  {
    assignmentId: { type: String, required: true },
    activityCompletions: { type: [ActivityCompletionSchema], default: [] },
    relevantGoogleDocs: { type: [RelevantGoogleDocSchema], default: [] },
    instructorGrade: {
      type: InstructorGradeSchema,
      default: null,
      required: false,
    },
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

// eslint-disable-next-line   @typescript-eslint/no-explicit-any
StudentDataSchema.pre(/^find/, function (this: any) {
  this.where({ deleted: { $ne: true } });
});

export default mongoose.model<StudentData, Model<StudentData>>(
  "StudentData",
  StudentDataSchema
);
