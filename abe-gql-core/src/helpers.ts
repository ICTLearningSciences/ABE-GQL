/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import Ajv from "ajv";
const ajv = new Ajv();
import * as dotenv from "dotenv";
import mongoose, { Model } from "mongoose";
import GDocVersionModel, {
  VersionType,
} from "./schemas/models/GoogleDocVersion";
import { IGDocVersion } from "./schemas/models/GoogleDocVersion";
import TextDiffCreate, { Change } from "textdiff-create";
import TextDiffPatch from "textdiff-patch";
import StudentDataModel, { StudentData } from "./schemas/models/StudentData";
import CourseModel from "./schemas/models/Course";
dotenv.config();

const queryPayloadSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    query: {
      type: "string",
      maxLength: 2000,
    },
    variables: {
      type: "null",
    },
  },
};

// eslint-disable-next-line   @typescript-eslint/no-explicit-any
export function verifyQueryPayload(req: any, res: any) {
  validateJson(req, res, queryPayloadSchema);
}

// eslint-disable-next-line   @typescript-eslint/no-explicit-any
export function validateJson(req: any, res: any, schema: any) {
  const body = req.body;
  if (!body) {
    return res.status(400).send({ error: "Expected Body" });
  }
  const validate = ajv.compile(schema);
  const valid = validate(body);
  if (!valid) {
    console.log(validate.errors);
    throw new Error(`invalid request`);
  }
}

// check if id is a valid ObjectID:
//  - if valid, return it
//  - if invalid, create a valid object id
export function idOrNew(id: string): string {
  if (!Boolean(id)) {
    return `${new mongoose.Types.ObjectId()}`;
  }
  return isId(id) ? id : `${new mongoose.Types.ObjectId()}`;
}

export function isId(id: string): boolean {
  return Boolean(id.match(/^[0-9a-fA-F]{24}$/));
}

function mergeDocVersions(
  base: IGDocVersion,
  delta: Partial<IGDocVersion>
): IGDocVersion {
  const deltaChanges = delta.plainTextDelta
    ? (JSON.parse(delta.plainTextDelta) as Change[])
    : ([[0, base.plainText.length]] as Change[]);
  const markdownDiff = delta.markdownTextDelta
    ? (JSON.parse(delta.markdownTextDelta) as Change[])
    : ([[0, base.markdownText?.length || 0]] as Change[]);
  return {
    ...base,
    ...delta,
    plainText: TextDiffPatch(base.plainText, deltaChanges),
    markdownText: TextDiffPatch(base.markdownText, markdownDiff),
  };
}

function validateSessionGroup(sessionGroup: IGDocVersion[]): void {
  if (sessionGroup[0].versionType !== VersionType.SNAPSHOT) {
    throw new Error("Session missing a beginning snapshot");
  }
}

/**
 * Hydrates an array of versions.
 * If the array is an array of version ids, then fetch the versions from the database to hydrate.
 * @param versionsToHydrate - An array of version ids or version objects.
 * @returns An array of hydrated IGDocVersion objects.
 */
export async function hydrateDocVersions(
  versionsToHydrate: string[] | IGDocVersion[]
): Promise<IGDocVersion[]> {
  if (!versionsToHydrate || versionsToHydrate.length === 0) return [];
  const isStringArray = typeof versionsToHydrate[0] === "string";
  let requestedVersions: IGDocVersion[];
  let versionIds: string[];
  if (isStringArray) {
    versionIds = versionsToHydrate as string[];
    requestedVersions = await GDocVersionModel.find({
      _id: { $in: versionIds },
    }).lean();
  } else {
    requestedVersions = versionsToHydrate as IGDocVersion[];
    versionIds = requestedVersions.map((v) => `${v._id}`);
  }
  if (!requestedVersions.length) return [];

  // Group by sessionId
  const sessionGroups: Record<string, IGDocVersion[]> = {};
  for (const v of requestedVersions) {
    if (!sessionGroups[v.sessionId]) sessionGroups[v.sessionId] = [];
    sessionGroups[v.sessionId].push(v);
  }

  const existingIds = requestedVersions.map((v: IGDocVersion) => String(v._id));

  // fetch and merge missing versions for each session
  const missingVersions: IGDocVersion[] = await GDocVersionModel.find({
    sessionId: { $in: Object.keys(sessionGroups) },
    _id: { $nin: existingIds },
  }).lean();
  for (const v of missingVersions) {
    sessionGroups[v.sessionId].push(v);
  }

  // For each group, sort by createdAt and merge deltas onto snapshot
  const hydratedVersions: IGDocVersion[] = [];
  for (const sessionId of Object.keys(sessionGroups)) {
    const versions = sessionGroups[sessionId].slice();
    if (!versions.length) {
      console.log(`Session ${sessionId} has no versions`);
      continue;
    }
    versions.sort(
      (a: IGDocVersion, b: IGDocVersion) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    validateSessionGroup(versions);
    let temp: IGDocVersion | null = null;
    for (const v of versions) {
      if (v.versionType === VersionType.SNAPSHOT) {
        temp = { ...v };
      } else if (v.versionType === VersionType.DELTA && temp) {
        temp = mergeDocVersions(temp, v);
      }
      // If this version was requested, add the hydrated version
      if (Boolean(versionIds.find((id) => `${id}` === `${v._id}`)) && temp) {
        hydratedVersions.push({ ...temp });
      }
    }
  }
  return hydratedVersions;
}

export function dateNMinutesInFuture(n: number): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + n);
  return now;
}

export function dateNMinutesInPast(n: number): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() - n);
  return now;
}

export function getDeltaDoc(
  docCurrentState: IGDocVersion,
  newVersion: IGDocVersion
): Partial<IGDocVersion> {
  if (docCurrentState.docId !== newVersion.docId) {
    throw new Error("DocId mismatch");
  }
  if (docCurrentState.sessionId !== newVersion.sessionId) {
    throw new Error("SessionId mismatch");
  }
  const deltaDoc: Partial<IGDocVersion> = {
    versionType: VersionType.DELTA,
    docId: docCurrentState.docId,
    sessionId: docCurrentState.sessionId,
  };
  const fieldsToCheck: (keyof IGDocVersion)[] = [
    "lastChangedId",
    "sessionIntention",
    "dayIntention",
    "documentIntention",
    "chatLog",
    "activity",
    "intent",
    "title",
  ];

  for (const field of fieldsToCheck) {
    if (
      JSON.stringify(newVersion[field]) !==
      JSON.stringify(docCurrentState[field])
    ) {
      // @ts-expect-error TS2322: Safe to ignore due to keyof indexing limitations
      deltaDoc[field] = newVersion[field];
    }
  }
  const plainDiff = TextDiffCreate(
    docCurrentState.plainText,
    newVersion.plainText
  );
  const markdownDiff = TextDiffCreate(
    docCurrentState.markdownText ?? "",
    newVersion.markdownText ?? ""
  );
  deltaDoc.plainTextDelta = JSON.stringify(plainDiff);
  deltaDoc.markdownTextDelta = JSON.stringify(markdownDiff);
  return deltaDoc;
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export async function validateIds<T extends Model<any>>(
  idField: string,
  ids: string[],
  model: T
): Promise<boolean> {
  const documents = await model.find().where(idField).in(ids);
  return documents.length === ids.length;
}

const hasCommonString = (arr1: string[], arr2: string[]): boolean => {
  return arr1.some((item) => arr2.includes(item));
};

export async function removeStudentFromSection(
  studentId: string,
  sectionId: string
): Promise<StudentData> {
  const student = await StudentDataModel.findOne({
    userId: studentId,
  });
  if (!student) {
    throw new Error("student not found");
  }
  student.enrolledSections = student.enrolledSections.filter(
    (section) => `${section}` !== `${sectionId}`
  );
  const courseWithSection = await CourseModel.findOne({
    sectionIds: { $in: [sectionId] },
  });
  if (!courseWithSection) {
    throw new Error("course not found");
  }
  // remove course if hanging.
  const hasSectionInCourse = hasCommonString(
    student.enrolledSections,
    courseWithSection.sectionIds
  );
  if (!hasSectionInCourse) {
    student.enrolledCourses = student.enrolledCourses.filter(
      (course) => `${course}` !== `${courseWithSection._id}`
    );
  }
  return await student.save();
}
