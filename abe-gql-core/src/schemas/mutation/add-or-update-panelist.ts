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
import PanelistModel, {
  Panelist,
  PanelistInputType,
  PanelistType,
} from "../models/Panelist";
import * as dotenv from "dotenv";
dotenv.config();

export const addOrUpdatePanelist = {
  type: PanelistType,
  args: {
    panelist: { type: PanelistInputType },
  },
  async resolve(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _: any,
    args: {
      panelist: Partial<Panelist>;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: any
  ) {
    try {
      if (!context.userId) {
        throw new Error("unauthorized");
      }

      const { panelist } = args;
      if (!panelist.clientId) {
        throw new Error("clientId is required");
      }

      // Filter out undefined and null values, but keep empty strings
      const updateData: Partial<Panelist> = {};
      Object.keys(panelist).forEach((key) => {
        const value = panelist[key as keyof Panelist];
        if (value !== undefined && value !== null) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (updateData as any)[key] = value;
        }
      });

      const updatedPanelist = await PanelistModel.findOneAndUpdate(
        {
          clientId: panelist.clientId,
        },
        {
          $set: updateData,
        },
        {
          new: true,
          upsert: true,
        }
      );
      return updatedPanelist;
    } catch (e) {
      console.log(e);
      throw new Error(String(e));
    }
  },
};
export default addOrUpdatePanelist;
