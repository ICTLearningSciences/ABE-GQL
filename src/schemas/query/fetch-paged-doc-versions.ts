import GdocVersionModel, {
  GDocVersionObjectType,
} from "../../schemas/models/GoogleDocVersion";
import findAll from "./find-all";

export const docVersions = findAll({
  nodeType: GDocVersionObjectType,
  model: GdocVersionModel,
});
