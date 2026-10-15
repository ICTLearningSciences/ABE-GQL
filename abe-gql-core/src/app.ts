/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import express, { Express, Request } from "express";
import { graphqlHTTP } from "express-graphql";
import bodyParser from "body-parser";
import cors from "cors";
import * as dotenv from "dotenv";
import jwt from "jsonwebtoken";
import AWS from "aws-sdk";

import { getAuthenticatedSchema } from "./schemas/publicSchema";

dotenv.config();

const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : [
      "https://dev.abewriting.org",
      "https://army.dev.abewriting.org",
      "https://army.abewriting.org",
    ];

//START MIDDLEWARE
import mongoose from "mongoose";
import { UserRole } from "./schemas/types/types";
import { createGoogleDocVersionLoader } from "./dataloaders/googleDocVersionLoader";

const corsOptions = {
  credentials: true,
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: string) => void
  ) {
    if (!origin) {
      callback(null, "");
    } else {
      let allowOrigin = false;
      for (const co of CORS_ORIGIN) {
        if (origin === co || origin.endsWith(co)) {
          allowOrigin = true;
          break;
        }
      }
      if (allowOrigin) {
        callback(null, origin);
      } else {
        callback(new Error(`${origin} not allowed by CORS`));
      }
    }
  },
};

export async function appStart(): Promise<void> {
  const mongooseConnect = (await import("./utils/mongoose-connect")).default;
  await mongooseConnect(process.env.MONGO_URI || "");
}

export async function appStop(): Promise<void> {
  try {
    mongoose.connection.removeAllListeners();
    await mongoose.disconnect();
  } catch (err) {
    console.error("error on mongoose disconnect: " + err);
  }
}

function getSubdomainFromRequest(req: Request): string {
  try {
    const origin = req.header("origin");
    if (origin) {
      const subdomain = /:\/\/([^\/]+)/.exec(origin)[1].split(".")[0];
      return subdomain || "";
    }
    return "";
  } catch (err) {
    return "";
  }
}

export interface JwtData {
  userId: string;
  userRole: string;
}

export async function getDataFromRequest(
  req: Request
): Promise<JwtData | undefined> {
  try {
    const splitAuthHeader = req.headers.authorization?.split(" ");
    if (
      splitAuthHeader &&
      splitAuthHeader.length === 2 &&
      splitAuthHeader[0].toLowerCase() === "bearer"
    ) {
      const token = req.headers.authorization?.split(" ")[1] || "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decodedJwt: any = jwt.verify(token, process.env.JWT_SECRET || "");
      return {
        userId: decodedJwt.id,
        userRole: decodedJwt.role,
      };
    }
    return undefined;
  } catch (err) {
    return undefined;
  }
}

export function createApp(): Express {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(cors(corsOptions));
  app.use(
    "/graphql",
    graphqlHTTP(async (req: Request, res) => {
      const jwtData = await getDataFromRequest(req);
      const userRole = jwtData ? (jwtData.userRole as UserRole) : UserRole.USER;
      const userId = jwtData ? jwtData.userId : undefined;
      return {
        schema: getAuthenticatedSchema(userRole, userId),
        graphiql: true,
        context: {
          req: req,
          res: res,
          subdomain: getSubdomainFromRequest(req),
          userRole,
          userId,
          googleDocVersionLoader: createGoogleDocVersionLoader(),
        },
      };
    })
  );
  app.get("/s3list", async (req, res, next) => {
    const userData = await getDataFromRequest(req);
    if (
      !userData ||
      (userData.userRole !== "CONTENT_MANAGER" && userData.userRole !== "ADMIN")
    ) {
      return res.status(500).send("invalid user");
    }
    const s3 = new AWS.S3({ region: process.env.AWS_REGION || "" });
    const data = await s3
      .listObjects({
        Bucket: process.env.RAG_BUCKET || "",
      })
      .promise();
    return res.status(200).json(data);
  });
  app.post("/s3upload", async (req, res, next) => {
    const userData = await getDataFromRequest(req);
    if (
      !userData ||
      (userData.userRole !== "CONTENT_MANAGER" && userData.userRole !== "ADMIN")
    ) {
      return res.status(500).send("invalid user");
    }
    const s3 = new AWS.S3({ region: process.env.AWS_REGION || "" });
    const data = await s3.createPresignedPost({
      Bucket: process.env.RAG_BUCKET || "",
      Fields: {
        Key: req.body.Key,
        ContentType: req.body.ContentType,
        ACL: "public-read",
      },
    });
    return res.status(200).json(data);
  });
  app.post("/polly", async (req, res, next) => {
    const userData = await getDataFromRequest(req);
    if (!userData) {
      return res.status(500).send("invalid user");
    }
    const s3 = new AWS.Polly({ region: process.env.AWS_REGION || "" });
    const data = await s3
      .synthesizeSpeech({
        Text: req.body.Text,
        Engine: req.body.Engine,
        VoiceId: req.body.VoiceId,
        LanguageCode: req.body.LanguageCode,
        TextType: req.body.TextType,
        OutputFormat: req.body.OutputFormat || "mp3",
      })
      .promise();
    return res.status(200).json(data);
  });
  return app;
}

export default createApp;
