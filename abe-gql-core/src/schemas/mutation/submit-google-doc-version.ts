/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { getDeltaDoc } from "../../helpers";
import GDocVersionModel, {
  GDocVersionObjectType,
  GDocVersionInputType,
  IGDocVersion,
  VersionType,
  DocVersionCurrentStateModel,
} from "../models/GoogleDocVersion";
import { GraphQLNonNull } from "graphql";

export const submitGoogleDocVersion = {
  type: GDocVersionObjectType,
  args: {
    googleDocData: { type: GraphQLNonNull(GDocVersionInputType) },
  },
  async resolve(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _: any,
    args: {
      googleDocData: IGDocVersion;
    }
  ) {
    try {
      const currentState = await DocVersionCurrentStateModel.findOne({
        sessionId: args.googleDocData.sessionId,
      });
      const shouldStoreSnapshot = !currentState;
      if (shouldStoreSnapshot) {
        args.googleDocData.versionType = VersionType.SNAPSHOT;
        const doc = await GDocVersionModel.create({ ...args.googleDocData });
        await DocVersionCurrentStateModel.create({
          ...args.googleDocData,
          versionType: VersionType.SNAPSHOT,
        });
        return doc;
      } else {
        args.googleDocData.versionType = VersionType.DELTA;
        const deltaDoc = getDeltaDoc(currentState, args.googleDocData);
        const doc = await GDocVersionModel.create({ ...deltaDoc });
        await DocVersionCurrentStateModel.updateOne(
          { _id: currentState._id },
          { $set: { ...args.googleDocData, versionType: VersionType.SNAPSHOT } }
        );
        return doc;
      }
    } catch (e) {
      console.log(e);
      throw new Error(String(e));
    }
  },
};

export default submitGoogleDocVersion;
