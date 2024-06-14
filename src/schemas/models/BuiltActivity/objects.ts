import { GraphQLObjectType, GraphQLString, GraphQLBoolean, GraphQLList, GraphQLInputObjectType } from "graphql";
import { Schema } from "mongoose";

export const ActivityBuilderStepType = new GraphQLObjectType({
    name: "ActivityBuilderStepType",
    fields: () => ({
        stepId: { type: GraphQLString },
        stepType: { type: GraphQLString },
        jumpToStepId: { type: GraphQLString },
    }),
});

export const ActivityBuilderStepTypeInput = new GraphQLInputObjectType({
    name: "ActivityBuilderStepTypeInput",
    fields: () => ({
        stepId: { type: GraphQLString },
        stepType: { type: GraphQLString },
        jumpToStepId: { type: GraphQLString },
    }),
});



export const SystemMessageActivityStepType = new GraphQLObjectType({
    name: "SystemMessageActivityStepType",
    fields: () => ({
        ...ActivityBuilderStepType.getFields(),
        stepType: { type: GraphQLString, value: "SystemMessage" },
        message: { type: GraphQLString },
    }),
});

export const SystemMessageActivityStepTypeInput = new GraphQLInputObjectType({
    name: "SystemMessageActivityStepTypeInput",
    fields: () => ({
        ...ActivityBuilderStepTypeInput.getFields(),
        stepType: { type: GraphQLString, value: "SystemMessage" },
        message: { type: GraphQLString },
    }),
});



export const PredefinedResponseType = new GraphQLObjectType({
    name: "PredefinedResponseType",
    fields: () => ({
        message: { type: GraphQLString },
    }),
});

export const PredefinedResponseTypeInput = new GraphQLInputObjectType({
    name: "PredefinedResponseTypeInput",
    fields: () => ({
        message: { type: GraphQLString },
    }),
});



export const RequestUserInputActivityStepType = new GraphQLObjectType({
    name: "RequestUserInputActivityStepType",
    fields: () => ({
        ...ActivityBuilderStepType.getFields(),
        stepType: { type: GraphQLString, value: "RequestUserInput" },
        message: { type: GraphQLString },
        saveAsIntention: { type: GraphQLBoolean },
        saveResponseVariableName: { type: GraphQLString },
        disableFreeInput: { type: GraphQLBoolean },
        predefinedResponses: { type: GraphQLList(PredefinedResponseType) },
    }),
});

export const RequestUserInputActivityStepTypeInput = new GraphQLInputObjectType({
    name: "RequestUserInputActivityStepTypeInput",
    fields: () => ({
        ...ActivityBuilderStepTypeInput.getFields(),
        stepType: { type: GraphQLString, value: "RequestUserInput" },
        message: { type: GraphQLString },
        saveAsIntention: { type: GraphQLBoolean },
        saveResponseVariableName: { type: GraphQLString },
        disableFreeInput: { type: GraphQLBoolean },
        predefinedResponses: { type: GraphQLList(PredefinedResponseTypeInput) },
    }),
});



export const JsonResponseDataType = new GraphQLObjectType({
    name: "JsonResponseDataType",
    fields: () => ({
        name: { type: GraphQLString },
        type: { type: GraphQLString },
        isRequired: { type: GraphQLBoolean },
        additionalInfo: { type: GraphQLString },
    }),
});

export const JsonResponseDataTypeInput = new GraphQLInputObjectType({
    name: "JsonResponseDataTypeInput",
    fields: () => ({
        name: { type: GraphQLString },
        type: { type: GraphQLString },
        isRequired: { type: GraphQLBoolean },
        additionalInfo: { type: GraphQLString },
    }),
});

export const PromptActivityStepType = new GraphQLObjectType({
    name: "PromptActivityStepType",
    fields: () => ({
        ...ActivityBuilderStepType.getFields(),
        stepType: { type: GraphQLString, value: "Prompt" },
        promptText: { type: GraphQLString },
        responseFormat: { type: GraphQLString },
        includeChatLogContext: { type: GraphQLBoolean },
        includeEssay: { type: GraphQLBoolean },
        outputDataType: { type: GraphQLString },
        jsonResponseData: { type: GraphQLList(JsonResponseDataType) },
        customSystemRole: { type: GraphQLString },
    }),
});

export const PromptActivityStepTypeInput = new GraphQLInputObjectType({
    name: "PromptActivityStepTypeInput",
    fields: () => ({
        ...ActivityBuilderStepTypeInput.getFields(),
        stepType: { type: GraphQLString, value: "Prompt" },
        promptText: { type: GraphQLString },
        responseFormat: { type: GraphQLString },
        includeChatLogContext: { type: GraphQLBoolean },
        includeEssay: { type: GraphQLBoolean },
        outputDataType: { type: GraphQLString },
        jsonResponseData: { type: GraphQLList(JsonResponseDataTypeInput) },
        customSystemRole: { type: GraphQLString },
    }),
});

// schemas
export const ActivityBuilderStepSchema = new Schema(
    {
        stepId: { type: String },
        stepType: { type: String },
        jumpToStepId: { type: String },
    },
);

export const SystemMessageActivityStepSchema = new Schema(
    {
        ...ActivityBuilderStepSchema.obj,
        stepType: { type: String, default: "SystemMessage" },
        message: { type: String },
    },
);

export const RequestUserInputActivityStepSchema = new Schema(
    {
        ...ActivityBuilderStepSchema.obj,
        stepType: { type: String, default: "RequestUserInput" },
        message: { type: String },
        saveAsIntention: { type: Boolean },
        saveResponseVariableName: { type: String },
        disableFreeInput: { type: Boolean },
        predefinedResponses: [{ type: String }],
    },
);

export const JsonResponseDataSchema = new Schema(
    {
        name: { type: String },
        type: { type: String },
        isRequired: { type: Boolean },
        additionalInfo: { type: String },
    },
);

export const PromptActivityStepSchema = new Schema(
    {
        ...ActivityBuilderStepSchema.obj,
        stepType: { type: String, default: "Prompt" },
        promptText: { type: String },
        responseFormat: { type: String },
        includeChatLogContext: { type: Boolean },
        includeEssay: { type: Boolean },
        outputDataType: { type: String },
        jsonResponseData: [JsonResponseDataSchema],
        customSystemRole: { type: String },
    },
);