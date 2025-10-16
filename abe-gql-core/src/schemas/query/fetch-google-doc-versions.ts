/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import GDocVersionModel, {
  GDocVersionObjectType,
} from "../models/GoogleDocVersion";
import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
} from "graphql";
import * as dotenv from "dotenv";
import {
  getObjectSizeInMB,
  getTimelineSlicesFinalVersions,
  hydrateDocVersions,
} from "../../helpers";
import logger from "utils/logging";
dotenv.config();

export const fetchGoogleDocVersions = {
  type: GraphQLList(GDocVersionObjectType),
  args: {
    googleDocId: { type: GraphQLNonNull(GraphQLString) },
    timelinePointsOnly: { type: GraphQLBoolean },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async resolve(
    _: any,
    args: {
      googleDocId: string;
      timelinePointsOnly: boolean;
    }
  ) {
    try {
      const versions = await GDocVersionModel.find({
        docId: args.googleDocId,
      }).lean();
      const hydratedVersions = await hydrateDocVersions(versions);
      const sizeInMB = getObjectSizeInMB(hydratedVersions);
      logger.info(`Hydrated version size: ${sizeInMB} MB`);

      if (args.timelinePointsOnly) {
        const finalVersions = await getTimelineSlicesFinalVersions(
          hydratedVersions
        );
        return finalVersions;
      }

      return hydratedVersions;
    } catch (e) {
      console.log(e);
      throw new Error(String(e));
    }
  },
};
export default fetchGoogleDocVersions;
