/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved.
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import DataLoader from "dataloader";
import GoogleDocVersionsModel, {
  IGDocVersion,
} from "../schemas/models/GoogleDocVersion";

export interface GoogleDocVersionData {
  mostRecent: IGDocVersion | null;
  mostRecentWithTitle: IGDocVersion | null;
}

async function batchLoadGoogleDocVersions(
  docIds: readonly string[]
): Promise<GoogleDocVersionData[]> {
  const [mostRecent, mostRecentWithTitle] = await Promise.all([
    GoogleDocVersionsModel.aggregate([
      { $match: { docId: { $in: docIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$docId",
          doc: { $first: "$$ROOT" },
        },
      },
    ]),
    GoogleDocVersionsModel.aggregate([
      {
        $match: {
          docId: { $in: docIds },
          title: { $exists: true, $ne: "" },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$docId",
          doc: { $first: "$$ROOT" },
        },
      },
    ]),
  ]);
  return docIds.map((docId) => {
    return {
      mostRecent: mostRecent.find((v) => v._id === docId)?.doc || null,
      mostRecentWithTitle:
        mostRecentWithTitle.find((v) => v._id === docId)?.doc || null,
    };
  });
}

export function createGoogleDocVersionLoader() {
  return new DataLoader<string, GoogleDocVersionData>(
    batchLoadGoogleDocVersions
  );
}
