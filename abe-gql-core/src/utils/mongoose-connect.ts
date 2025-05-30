/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose from "mongoose";
import requireEnv from "./require-env";
import { logger } from "./logging";
import GoogleDocVersion from "../schemas/models/GoogleDocVersion";

/**
 * Connect mongoose using env variables:
 * MONGO_USER
 * MONGO_PASSWORD
 * MONGO_HOST (includes port, may also be a comma-sep list of host1:port1,host2:port2 for replicate set)
 * MONGO_DB - database name
 * MONGO_QUERY_STRING - query string
 */
export default async function mongooseConnect(uri: string): Promise<void> {
  const mongoUri =
    uri ||
    process.env.MONGO_URI ||
    `mongodb://${requireEnv("MONGO_USER")}:${requireEnv(
      "MONGO_PASSWORD"
    )}@${requireEnv("MONGO_HOST")}/${requireEnv("MONGO_DB")}${
      process.env.MONGO_QUERY_STRING || ""
    }`;
  mongoose.set("strictQuery", false);
  GoogleDocVersion.syncIndexes();
  await mongoose.connect(mongoUri);
  logger.info(
    "mongoose: connection successful " + mongoUri.replace(/^.*@/g, "")
  );
}
