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
import PanelModel, { Panel, PanelInputType, PanelType } from "../models/Panel";
import * as dotenv from "dotenv";
dotenv.config();

export const addOrUpdatePanel = {
  type: PanelType,
  args: {
    panel: { type: PanelInputType },
  },
  async resolve(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _: any,
    args: {
      panel: Partial<Panel>;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: any
  ) {
    try {
      if (!context.userId) {
        throw new Error("unauthorized");
      }

      const { panel } = args;
      if (!panel.clientId) {
        throw new Error("clientId is required");
      }

      // Filter out undefined and null values, but keep empty strings
      const updateData: Partial<Panel> = {};
      Object.keys(panel).forEach((key) => {
        const value = panel[key as keyof Panel];
        if (value !== undefined && value !== null) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (updateData as any)[key] = value;
        }
      });

      const updatedPanel = await PanelModel.findOneAndUpdate(
        {
          clientId: panel.clientId,
        },
        {
          $set: updateData,
        },
        {
          new: true,
          upsert: true,
        }
      );
      return updatedPanel;
    } catch (e) {
      console.log(e);
      throw new Error(String(e));
    }
  },
};
export default addOrUpdatePanel;
