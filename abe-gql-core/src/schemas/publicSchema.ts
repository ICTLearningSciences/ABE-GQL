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
import fetchDocTimeline from "./query/fetch-doc-timeline";
import storeDocTimeline from "./mutation/store-doc-timeline";
import fetchMostRecentVersion from "./query/fetch-most-recent-version";
import deleteGoogleDoc from "./mutation/delete-google-doc";
import addOrUpdateActivity from "./mutation/add-or-update-activity";
import fetchActivities from "./query/fetch-activities";
import fetchBuiltActivities from "./query/fetch-built-activities";
import addOrUpdateBuiltActivity from "./mutation/add-or-update-built-activity";
import fetchBuiltActivityVersions from "./query/fetch-built-activity-versions";
import storeBuiltActivityVersion from "./mutation/store-built-activity-version";
import { UserRole } from "./models/User";
import copyBuiltActivity from "./mutation/copy-built-activity";
import deleteBuiltActivity from "./mutation/delete-built-activity";
import loginMicrosoft from "./mutation/login-microsoft";
import loginAmazonCognito from "./mutation/login-amazon-cognito";
import updateUserInfo from "./mutation/update-user-info";
import addOrUpdateDoc from "./mutation/add-or-update-google-doc";
import fetchVersionsById from "./query/fetch-versions-by-id";
import createNewStudent from "./mutation/create-new-student";
import createNewInstructor from "./mutation/create-new-instructor";
import modifyCourseEnrollment from "./mutation/modify-course-enrollment";
import modifySectionEnrollment from "./mutation/modify-section-enrollment";
import modifyStudentAssignmentProgress from "./mutation/modify-student-assignment-progress";
import addOrUpdateCourse from "./mutation/add-or-update-course";
import addOrUpdateSection from "./mutation/add-or-update-section";
import addOrUpdateAssignment from "./mutation/add-or-update-assignment";
import fetchCourses from "./query/fetch-courses";
import fetchSections from "./query/fetch-sections";
import fetchAssignments from "./query/fetch-assignments";
import fetchStudentsInMyCourses from "./query/fetch-students-in-my-courses";
import modifyCourseShareStatus from "./mutation/modify-course-share-status";
const publicQueries = {
  fetchGoogleDocVersions,
  fetchGoogleDocs,
  fetchAdminGoogleDocs,
  fetchPromptRuns,
  fetchPrompts,
  fetchConfig,
  fetchDocGoals,
  fetchActivities,
  fetchUserActivityStates,
  fetchDocTimeline,
  fetchBuiltActivities,
  fetchBuiltActivityVersions,
  fetchMostRecentVersion,
  fetchVersionsById,
  fetchCourses,
  fetchSections,
  fetchAssignments,
  fetchStudentsInMyCourses,
};

const getAuthenticatedQueries = () => {
  return publicQueries;
};

const publicMutations = {
  submitGoogleDocVersion,
  loginGoogle,
  refreshAccessToken,
  storeGoogleDoc,
  storePromptRun,
  storePrompt,
  storePrompts,
  updateUserActivityState,
  storeDocTimeline,
  deleteGoogleDoc,
  loginMicrosoft,
  loginAmazonCognito,
  updateUserInfo,
  addOrUpdateDoc,
  createNewStudent,
  createNewInstructor,
  modifyCourseEnrollment,
  modifySectionEnrollment,
  modifyStudentAssignmentProgress,
  addOrUpdateCourse,
  addOrUpdateSection,
  addOrUpdateAssignment,
  modifyCourseShareStatus,
};

const contentManagerMutations = {
  ...publicMutations,
  addOrUpdateActivity,
  addOrUpdateBuiltActivity,
  storeBuiltActivityVersion,
  configUpdateByKey,
  configUpdate,
  copyBuiltActivity,
  deleteBuiltActivity,
};

const adminMutations = {
  ...contentManagerMutations,
};

const getAuthenticatedMutations = (userRole: UserRole) => {
  return userRole === UserRole.ADMIN
    ? adminMutations
    : userRole === UserRole.CONTENT_MANAGER
    ? contentManagerMutations
    : publicMutations;
};

export function getAuthenticatedSchema(userRole: UserRole): GraphQLSchema {
  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "AuthenticatedQuery",
      fields: getAuthenticatedQueries(),
    }),
    mutation: new GraphQLObjectType({
      name: "AuthenticatedMutation",
      fields: getAuthenticatedMutations(userRole),
    }),
  });
}
