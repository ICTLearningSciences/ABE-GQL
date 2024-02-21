/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType, GraphQLSchema } from "graphql";

// Queries
import submitGoogleDocVersion from "./mutation/submit-google-doc-version";
import fetchGoogleDocVersions from "./query/fetch-google-doc-versions";
import loginGoogle from "./mutation/login-google";
import refreshAccessToken from "./mutation/refresh-access-token";
import storeGoogleDoc from "./mutation/store-google-doc";
import fetchGoogleDocs from "./query/fetch-google-docs";
import fetchAdminGoogleDocs from "./query/fetch-admin-google-docs";
import storePromptRun from "./mutation/store-prompt-run";
import fetchPromptRuns from "./query/fetch-prompt-runs";
import fetchPrompts from "./query/fetch-prompts";
import storePrompt from "./mutation/store-prompt";
import storePrompts from "./mutation/store-prompts";
import configUpdate from "./mutation/config-update";
import fetchConfig from "./query/fetch-config";
import configUpdateByKey from "./mutation/config-update-key";
import fetchDocGoals from "./query/fetch-doc-goals";
import fetchUserActivityStates from "./query/fetch-user-activity-states";
import updateUserActivityState from "./mutation/update-user-activity-state";
import openAiAsyncJobUpdate from "./mutation/open-ai-async-job-update";
import fetchOpenAiAsyncJob from "./query/fetch-open-ai-async-job";

const PublicRootQuery = new GraphQLObjectType({
  name: "PublicRootQueryType",
  fields: {
    fetchGoogleDocVersions,
    fetchGoogleDocs,
    fetchAdminGoogleDocs,
    fetchPromptRuns,
    fetchPrompts,
    fetchConfig,
    fetchDocGoals,
    fetchUserActivityStates,
    fetchOpenAiAsyncJob,
  },
});

const PublicMutation = new GraphQLObjectType({
  name: "PublicMutation",
  fields: {
    submitGoogleDocVersion,
    loginGoogle,
    refreshAccessToken,
    storeGoogleDoc,
    storePromptRun,
    storePrompt,
    storePrompts,
    configUpdate,
    configUpdateByKey,
    updateUserActivityState,
    openAiAsyncJobUpdate,
  },
});

export default new GraphQLSchema({
  query: PublicRootQuery,
  mutation: PublicMutation,
});