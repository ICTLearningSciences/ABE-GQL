/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInputObjectType,
} from "graphql";
import { Schema } from "mongoose";
import { ActivityBuilderStepType as _ActivityBuilderStepType } from "./types";

export const ActivityBuilderStepType = new GraphQLObjectType({
  name: "ActivityBuilderStepType",
  fields: () => ({
    stepId: { type: GraphQLString },
    stepType: { type: GraphQLString },
    jumpToStepId: { type: GraphQLString },
    setStudentActivityComplete: { type: GraphQLBoolean },
  }),
});

export const ActivityBuilderStepTypeInput = new GraphQLInputObjectType({
  name: "ActivityBuilderStepTypeInput",
  fields: () => ({
    stepId: { type: GraphQLString },
    stepType: { type: GraphQLString },
    jumpToStepId: { type: GraphQLString },
    setStudentActivityComplete: { type: GraphQLBoolean },
  }),
});

export const SystemMessageActivityStepType = new GraphQLObjectType({
  name: "SystemMessageActivityStepType",
  fields: () => ({
    stepId: { type: GraphQLString },
    jumpToStepId: { type: GraphQLString },
    stepType: {
      type: GraphQLString,
      value: _ActivityBuilderStepType.SYSTEM_MESSAGE,
    },
    message: { type: GraphQLString },
    setStudentActivityComplete: { type: GraphQLBoolean },
  }),
});

export const SystemMessageActivityStepTypeInput = new GraphQLInputObjectType({
  name: "SystemMessageActivityStepTypeInput",
  fields: () => ({
    stepId: { type: GraphQLString },
    jumpToStepId: { type: GraphQLString },
    stepType: {
      type: GraphQLString,
      value: _ActivityBuilderStepType.SYSTEM_MESSAGE,
    },
    message: { type: GraphQLString },
    setStudentActivityComplete: { type: GraphQLBoolean },
  }),
});

export const PredefinedResponseType = new GraphQLObjectType({
  name: "PredefinedResponseType",
  fields: () => ({
    clientId: { type: GraphQLString },
    message: { type: GraphQLString },
    isArray: { type: GraphQLBoolean },
    jumpToStepId: { type: GraphQLString },
    responseWeight: { type: GraphQLString },
  }),
});

export const PredefinedResponseSchema = new Schema({
  clientId: { type: String },
  message: { type: String },
  isArray: { type: Boolean },
  jumpToStepId: { type: String, require: false },
  responseWeight: { type: String, default: "0" },
});

export const PredefinedResponseTypeInput = new GraphQLInputObjectType({
  name: "PredefinedResponseTypeInput",
  fields: () => ({
    clientId: { type: GraphQLString },
    message: { type: GraphQLString },
    isArray: { type: GraphQLBoolean },
    jumpToStepId: { type: GraphQLString },
    responseWeight: { type: GraphQLString },
  }),
});

export const RequestUserInputActivityStepType = new GraphQLObjectType({
  name: "RequestUserInputActivityStepType",
  fields: () => ({
    stepId: { type: GraphQLString },
    jumpToStepId: { type: GraphQLString },
    stepType: {
      type: GraphQLString,
      value: _ActivityBuilderStepType.REQUEST_USER_INPUT,
    },
    message: { type: GraphQLString },
    saveAsIntention: { type: GraphQLBoolean },
    saveResponseVariableName: { type: GraphQLString },
    disableFreeInput: { type: GraphQLBoolean },
    predefinedResponses: { type: GraphQLList(PredefinedResponseType) },
    setStudentActivityComplete: { type: GraphQLBoolean },
  }),
});

export const RequestUserInputActivityStepTypeInput = new GraphQLInputObjectType(
  {
    name: "RequestUserInputActivityStepTypeInput",
    fields: () => ({
      stepId: { type: GraphQLString },
      jumpToStepId: { type: GraphQLString },
      stepType: {
        type: GraphQLString,
        value: _ActivityBuilderStepType.REQUEST_USER_INPUT,
      },
      message: { type: GraphQLString },
      saveAsIntention: { type: GraphQLBoolean },
      saveResponseVariableName: { type: GraphQLString },
      disableFreeInput: { type: GraphQLBoolean },
      predefinedResponses: { type: GraphQLList(PredefinedResponseTypeInput) },
      setStudentActivityComplete: { type: GraphQLBoolean },
    }),
  }
);

export const PromptActivityStepType = new GraphQLObjectType({
  name: "PromptActivityStepType",
  fields: () => ({
    stepId: { type: GraphQLString },
    jumpToStepId: { type: GraphQLString },
    setStudentActivityComplete: { type: GraphQLBoolean },
    stepType: { type: GraphQLString, value: _ActivityBuilderStepType.PROMPT },
    promptText: { type: GraphQLString },
    responseFormat: { type: GraphQLString },
    includeChatLogContext: { type: GraphQLBoolean },
    includeEssay: { type: GraphQLBoolean },
    outputDataType: { type: GraphQLString },
    jsonResponseData: { type: GraphQLString },
    customSystemRole: { type: GraphQLString },
    webSearch: { type: GraphQLBoolean },
    editDoc: { type: GraphQLBoolean },
  }),
});

export const LogicStepConditionalType = new GraphQLObjectType({
  name: "LogicStepConditionalType",
  fields: () => ({
    stateDataKey: { type: GraphQLString },
    checking: { type: GraphQLString },
    operation: { type: GraphQLString },
    expectedValue: { type: GraphQLString },
    targetStepId: { type: GraphQLString },
  }),
});

export const LogicStepConditionalTypeInput = new GraphQLInputObjectType({
  name: "LogicStepConditionalTypeInput",
  fields: () => ({
    stateDataKey: { type: GraphQLString },
    checking: { type: GraphQLString },
    operation: { type: GraphQLString },
    expectedValue: { type: GraphQLString },
    targetStepId: { type: GraphQLString },
  }),
});

export const ConditionalActivityStepType = new GraphQLObjectType({
  name: "ConditionalActivityStepType",
  fields: () => ({
    stepId: { type: GraphQLString },
    jumpToStepId: { type: GraphQLString },

    stepType: {
      type: GraphQLString,
      value: _ActivityBuilderStepType.CONDITIONAL,
    },
    conditionals: { type: GraphQLList(LogicStepConditionalType) },
  }),
});

export const ConditionalActivityStepTypeInput = new GraphQLInputObjectType({
  name: "ConditionalActivityStepTypeInput",
  fields: () => ({
    stepId: { type: GraphQLString },
    jumpToStepId: { type: GraphQLString },
    stepType: {
      type: GraphQLString,
      value: _ActivityBuilderStepType.CONDITIONAL,
    },
    conditionals: { type: GraphQLList(LogicStepConditionalTypeInput) },
  }),
});

export const PromptActivityStepTypeInput = new GraphQLInputObjectType({
  name: "PromptActivityStepTypeInput",
  fields: () => ({
    stepId: { type: GraphQLString },
    jumpToStepId: { type: GraphQLString },
    setStudentActivityComplete: { type: GraphQLBoolean },
    stepType: { type: GraphQLString, value: _ActivityBuilderStepType.PROMPT },
    promptText: { type: GraphQLString },
    responseFormat: { type: GraphQLString },
    includeChatLogContext: { type: GraphQLBoolean },
    includeEssay: { type: GraphQLBoolean },
    outputDataType: { type: GraphQLString },
    jsonResponseData: { type: GraphQLString },
    customSystemRole: { type: GraphQLString },
    webSearch: { type: GraphQLBoolean },
    editDoc: { type: GraphQLBoolean },
  }),
});

// schemas

const ActivityBuilderStepSchema = new Schema(
  {
    stepId: { type: String },
    stepType: { type: String },
    jumpToStepId: { type: String },
    setStudentActivityComplete: { type: Boolean, default: false },
    // other common fields...
  },
  { timestamps: true, discriminatorKey: "stepType" } // Use stepType as the discriminator key
);

export const LogicStepConditionalSchema = new Schema({
  stateDataKey: { type: String },
  checking: { type: String },
  operation: { type: String },
  expectedValue: { type: String },
  targetStepId: { type: String },
});

export const LogicOperationActivityStepSchema = new Schema({
  ...ActivityBuilderStepSchema.obj,
  stepType: { type: String, default: _ActivityBuilderStepType.CONDITIONAL },
  conditionals: [LogicStepConditionalSchema],
});

export const SystemMessageActivityStepSchema = new Schema({
  ...ActivityBuilderStepSchema.obj,
  stepType: { type: String, default: _ActivityBuilderStepType.SYSTEM_MESSAGE },
  message: { type: String },
  setStudentActivityComplete: { type: Boolean },
});

export const RequestUserInputActivityStepSchema = new Schema({
  ...ActivityBuilderStepSchema.obj,
  stepType: {
    type: String,
    default: _ActivityBuilderStepType.REQUEST_USER_INPUT,
  },
  message: { type: String },
  saveAsIntention: { type: Boolean },
  saveResponseVariableName: { type: String },
  disableFreeInput: { type: Boolean },
  predefinedResponses: [PredefinedResponseSchema],
});

export const PromptActivityStepSchema = new Schema({
  ...ActivityBuilderStepSchema.obj,
  stepType: { type: String, default: _ActivityBuilderStepType.PROMPT },
  promptText: { type: String },
  responseFormat: { type: String },
  includeChatLogContext: { type: Boolean },
  includeEssay: { type: Boolean },
  outputDataType: { type: String },
  jsonResponseData: { type: String },
  customSystemRole: { type: String },
  webSearch: { type: Boolean },
  editDoc: { type: Boolean },
});

// union the 3 step schemas
export const ActivityBuilderStepUnionSchema = new Schema({
  ...SystemMessageActivityStepSchema.obj,
  ...RequestUserInputActivityStepSchema.obj,
  ...PromptActivityStepSchema.obj,
  ...LogicOperationActivityStepSchema.obj,
});
