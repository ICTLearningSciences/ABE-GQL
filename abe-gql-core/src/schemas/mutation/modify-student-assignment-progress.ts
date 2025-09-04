/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
} from "graphql";
import { UserRole } from "../models/User";
import StudentDataModel, {
  ActivityCompletion,
  RelevantGoogleDoc,
  StudentData,
  StudentDataType,
} from "../models/StudentData";
import CourseModel from "../models/Course";
import SectionModel from "../models/Section";
import AssignmentModel from "../models/Assignment";
import { AiModelService, AiModelServiceInputType } from "../models/Config";

export enum ModifyStudentAssignmentProgressActions {
  ACTIVITY_STARTED = "ACTIVITY_STARTED", // if activity not in list, add it with complete false
  ACTIVITY_COMPLETED = "ACTIVITY_COMPLETED", // if activity in list, set complete to true

  NEW_DOC_CREATED = "NEW_DOC_CREATED", // if doc not in list, add it with primaryDocument true IF only doc in list, else set primaryDocument to false
  DOC_PRIMARY_STATUS_SET = "DOC_PRIMARY_STATUS_SET", // if doc in list, update it with primaryDocument
  DOC_DELETED = "DOC_DELETED", // if doc in list, delete it

  DEFAULT_LLM_SET = "DEFAULT_LLM_SET", // if defaultLLM not in list, add it with defaultLLM
}

function applyActionToActivityCompletion(
  activityCompletions: ActivityCompletion[],
  action: ModifyStudentAssignmentProgressActions,
  activityId: string,
  defaultLLM?: AiModelService
): ActivityCompletion[] {
  const existingActivityCompletionIdx = activityCompletions.findIndex(
    (ac) => ac.activityId === activityId
  );
  console.log(activityCompletions);
  console.log(existingActivityCompletionIdx);

  if (action === ModifyStudentAssignmentProgressActions.DEFAULT_LLM_SET) {
    if (existingActivityCompletionIdx === -1) {
      return [
        ...activityCompletions,
        { activityId, complete: false, defaultLLM: defaultLLM },
      ];
    }
    return [
      ...activityCompletions.slice(0, existingActivityCompletionIdx),
      {
        ...activityCompletions[existingActivityCompletionIdx],
        defaultLLM: defaultLLM,
      },
      ...activityCompletions.slice(existingActivityCompletionIdx + 1),
    ];
  }

  // If ACTIVITY_STARTED, just add incomplete activity to activityCompletions list if not already there
  if (action === ModifyStudentAssignmentProgressActions.ACTIVITY_STARTED) {
    const existingActivityCompletion =
      activityCompletions[existingActivityCompletionIdx];
    if (existingActivityCompletion) {
      return activityCompletions;
    }
    return [...activityCompletions, { activityId, complete: false }];
  }
  if (existingActivityCompletionIdx === -1) {
    throw new Error(
      "Activity has not been started, it must be started before modify actions."
    );
  }
  const existingActivityCompletion =
    activityCompletions[existingActivityCompletionIdx];
  if (action === ModifyStudentAssignmentProgressActions.ACTIVITY_COMPLETED) {
    // If ACTIVITY_COMPLETED, set complete to true for activity
    return [
      ...activityCompletions.slice(0, existingActivityCompletionIdx),
      {
        ...existingActivityCompletion,
        complete: true,
      },
      ...activityCompletions.slice(existingActivityCompletionIdx + 1),
    ];
  }
  return activityCompletions;
}

function applyActionToRelevantGoogleDocs(
  relevantGoogleDocs: RelevantGoogleDoc[],
  action: ModifyStudentAssignmentProgressActions,
  docId: string
): RelevantGoogleDoc[] {
  if (!docId) {
    return relevantGoogleDocs;
  }
  const existingDocIdx = relevantGoogleDocs.findIndex(
    (rd) => rd.docId === docId
  );
  if (action === ModifyStudentAssignmentProgressActions.NEW_DOC_CREATED) {
    // If NEW_DOC_CREATED, add doc to relevantGoogleDocs list if not already there
    if (existingDocIdx !== -1) {
      return relevantGoogleDocs;
    }
    return [
      ...relevantGoogleDocs,
      {
        docId,
        primaryDocument: relevantGoogleDocs.length === 0,
      },
    ];
  } else if (
    action === ModifyStudentAssignmentProgressActions.DOC_PRIMARY_STATUS_SET
  ) {
    // If DOC_PRIMARY_STATUS_SET, set the target doc primaryDocument status to True, and ALL other docs to false.
    return relevantGoogleDocs.map((rd) => ({
      ...rd,
      primaryDocument: rd.docId === docId,
    }));
  } else if (action === ModifyStudentAssignmentProgressActions.DOC_DELETED) {
    // If DOC_DELETED, removed docId from the activities relevantGoogleDocs list
    return relevantGoogleDocs.filter((rd) => rd.docId !== docId);
  }
  return relevantGoogleDocs;
}

export const modifyStudentAssignmentProgress = {
  type: StudentDataType,
  args: {
    targetUserId: { type: GraphQLNonNull(GraphQLID) },
    courseId: { type: GraphQLNonNull(GraphQLID) },
    sectionId: { type: GraphQLNonNull(GraphQLID) },
    assignmentId: { type: GraphQLNonNull(GraphQLID) },
    activityId: { type: GraphQLNonNull(GraphQLID) },
    action: {
      type: GraphQLNonNull(GraphQLString),
      enum: Object.values(ModifyStudentAssignmentProgressActions),
    },
    docId: { type: GraphQLString },
    defaultLLM: { type: AiModelServiceInputType },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      targetUserId: string;
      courseId: string;
      sectionId: string;
      assignmentId: string;
      activityId: string;
      action: ModifyStudentAssignmentProgressActions;
      docId?: string;
      defaultLLM?: AiModelService;
    },
    context: {
      userId: string;
      userRole: UserRole;
    }
  ): Promise<StudentData> => {
    if (!context.userId) {
      throw new Error("authenticated user required");
    }

    if (
      args.action === ModifyStudentAssignmentProgressActions.DEFAULT_LLM_SET &&
      !args.defaultLLM
    ) {
      throw new Error("defaultLLM is required for defaultLLM actions");
    }

    const docActions = [
      ModifyStudentAssignmentProgressActions.NEW_DOC_CREATED,
      ModifyStudentAssignmentProgressActions.DOC_PRIMARY_STATUS_SET,
      ModifyStudentAssignmentProgressActions.DOC_DELETED,
    ];
    if (docActions.includes(args.action) && !args.docId) {
      throw new Error("docId is required for doc actions");
    }

    const studentData = await StudentDataModel.findOne({
      userId: args.targetUserId,
    });
    if (!studentData) {
      throw new Error("student data not found for target user");
    }

    const course = await CourseModel.findById(args.courseId);
    if (!course) {
      throw new Error("course not found");
    }

    const section = await SectionModel.findById(args.sectionId);
    if (!section) {
      throw new Error("section not found");
    }

    const assignment = await AssignmentModel.findById(args.assignmentId);
    if (!assignment) {
      throw new Error("assignment not found");
    }

    if (
      context.userId !== args.targetUserId &&
      course.instructorId !== context.userId &&
      context.userRole !== UserRole.ADMIN
    ) {
      throw new Error(
        "unauthorized: requesting user must be target user, course instructor or admin"
      );
    }

    if (!course.sectionIds.includes(args.sectionId)) {
      throw new Error("section does not belong to the specified course");
    }

    const sectionAssignment = section.assignments.find(
      (sa) => sa.assignmentId === args.assignmentId
    );
    if (!sectionAssignment) {
      throw new Error("assignment does not belong to the specified section");
    }

    const assignmentProgressIndex = studentData.assignmentProgress.findIndex(
      (progress) => progress.assignmentId === args.assignmentId
    );

    const activityCompletionsForAssignment =
      assignmentProgressIndex !== -1
        ? studentData.assignmentProgress[assignmentProgressIndex]
            .activityCompletions
        : [];

    const newActivityCompletions: ActivityCompletion[] =
      applyActionToActivityCompletion(
        activityCompletionsForAssignment,
        args.action,
        args.activityId,
        args.defaultLLM
      );

    const newRelevantGoogleDocs: RelevantGoogleDoc[] =
      applyActionToRelevantGoogleDocs(
        studentData.assignmentProgress[assignmentProgressIndex]
          ? studentData.assignmentProgress[assignmentProgressIndex]
              .relevantGoogleDocs
          : [],
        args.action,
        args.docId
      );

    if (assignmentProgressIndex !== -1) {
      studentData.assignmentProgress[
        assignmentProgressIndex
      ].activityCompletions = newActivityCompletions;
      studentData.assignmentProgress[
        assignmentProgressIndex
      ].relevantGoogleDocs = newRelevantGoogleDocs;
    } else {
      studentData.assignmentProgress.push({
        assignmentId: args.assignmentId,
        activityCompletions: newActivityCompletions,
        relevantGoogleDocs: newRelevantGoogleDocs,
      });
    }

    await studentData.save();
    return studentData;
  },
};

export default modifyStudentAssignmentProgress;
