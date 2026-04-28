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
