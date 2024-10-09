/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

export interface IActivity {
  activityType: "builder" | "gql";
}

export type ActivityBuilderStepUnion =
  | SystemMessageActivityStep
  | RequestUserInputActivityStep
  | PromptActivityStep
  | LogicOperationActivityStep;

export interface FlowItem {
  clientId: string;
  name: string;
  steps: ActivityBuilderStepUnion[];
}

export interface ActivityBuilder extends IActivity {
  _id: string;
  clientId: string;
  activityType: "builder";
  title: string;
  user: string;
  visibility: string;
  description: string;
  displayIcon: string;
  newDocRecommend?: boolean;
  disabled?: boolean;
  flowsList: FlowItem[];
}

export enum ActivityBuilderStepType {
  SYSTEM_MESSAGE = "SYSTEM_MESSAGE",
  REQUEST_USER_INPUT = "REQUEST_USER_INPUT",
  PROMPT = "PROMPT",
  CONDITIONAL = "CONDITIONAL",
}

export interface ActivityBuilderStep {
  stepId: string;
  stepType: ActivityBuilderStepType;
  jumpToStepId?: string;
}

export interface SystemMessageActivityStep extends ActivityBuilderStep {
  stepType: ActivityBuilderStepType.SYSTEM_MESSAGE;
  message: string;
}

export enum NumericOperations {
  GREATER_THAN = ">",
  LESS_THAN = "<",
  EQUALS = "==",
  NOT_EQUALS = "!=",
  GREATER_THAN_EQUALS = ">=",
  LESS_THAN_EQUALS = "<=",
}

export enum Checking {
  // array or string
  LENGTH = "LENGTH",
  // string, boolean, number
  VALUE = "VALUE",
  // array or string
  CONTAINS = "CONTAINS",
}

export interface LogicStepConditional {
  stateDataKey: string;
  checking: Checking;
  operation: NumericOperations;
  expectedValue: string;
  targetStepId: string;
}

export interface LogicOperationActivityStep extends ActivityBuilderStep {
  stepType: ActivityBuilderStepType.CONDITIONAL;
  conditionals: LogicStepConditional[];
}

// RequestUserInput
export interface PredefinedResponse {
  clientId: string;
  message: string;
  isArray?: boolean;
  jumpToStepId?: string;
  responseWeight?: string;
}

export interface RequestUserInputActivityStep extends ActivityBuilderStep {
  stepType: ActivityBuilderStepType.REQUEST_USER_INPUT;
  message: string;
  saveAsIntention: boolean;
  saveResponseVariableName: string;
  disableFreeInput: boolean;
  predefinedResponses: PredefinedResponse[];
}

//Prompt
export enum JsonResponseDataType {
  STRING = "string",
  OBJECT = "object",
  ARRAY = "array",
}

export interface PromptActivityStep extends ActivityBuilderStep {
  stepType: ActivityBuilderStepType.PROMPT;
  promptText: string;
  responseFormat: string;
  includeChatLogContext: boolean;
  includeEssay: boolean;
  outputDataType: string;
  jsonResponseData?: string;
  customSystemRole: string;
}
