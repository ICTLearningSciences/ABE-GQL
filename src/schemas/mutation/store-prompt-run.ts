/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import PromptRunModel, { OpenAiPromptStepInputType } from "../models/PromptRun";
import { GraphQLNonNull, GraphQLString, GraphQLID, GraphQLList } from "graphql";
import * as dotenv from "dotenv";
import { OpenAiStepsInputType, PromptRunType } from "../models/PromptRun";
dotenv.config();

export const storePromptRun = {
  type: PromptRunType,
  args: {
    googleDocId: { type: GraphQLNonNull(GraphQLString) },
    user: { type: GraphQLNonNull(GraphQLID) },
    openAiPromptSteps: {
      type: GraphQLNonNull(GraphQLList(OpenAiPromptStepInputType)),
    },
    openAiSteps: { type: GraphQLNonNull(GraphQLList(OpenAiStepsInputType)) },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async resolve(_: any, args: any) {
    try {
      const doc = await PromptRunModel.create({
        googleDocId: args.googleDocId,
        user: args.user,
        openAiPromptSteps: args.openAiPromptSteps,
        openAiSteps: args.openAiSteps,
      });
      return doc;
    } catch (e) {
      console.log(e);
      throw new Error(String(e));
    }
  },
};
export default storePromptRun;
