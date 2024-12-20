/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import express, { Express, Request } from "express";
import { graphqlHTTP } from "express-graphql";
import bodyParser from "body-parser";
import cors from "cors";
import { getAuthenticatedSchema } from "./schemas/publicSchema";
import * as dotenv from "dotenv";
import jwt from "jsonwebtoken";
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
import privateSchema from "./schemas/privateSchema";
import { UserRole } from "./schemas/models/User";

// eslint-disable-next-line   @typescript-eslint/no-explicit-any
const authorization = (req: any, res: any, next: any) => {
  if (process.env.ENV === "dev") {
    return next();
  }

  if (!req.body.data || !req.body.data.secret) {
    console.log(`failed to authorize, expected body`);
    return res
      .status(403)
      .send({ error: `failed to authorize, expected body` });
  }
  //when sending from postman: req.body.secret, else from webpage: req.body.data.secret
  const secret = req.body.data.secret;
  if (!secret) {
    console.log(`failed to authorize, expected secret`);
    return res
      .status(403)
      .send({ error: `failed to authorize, expected secret` });
  }
  if (secret !== process.env.GQL_SECRET) {
    console.log(`failed to authorize, secrets do not match`);
    return res
      .status(403)
      .send({ error: `failed to authorize, secret does not match` });
  }
  return next();
};

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

interface JwtData {
  userId: string;
  userRole: string;
}

async function getDataFromRequest(req: Request): Promise<JwtData | undefined> {
  try {
    const splitAuthHeader = req.headers.authorization?.split(" ");
    if (
      splitAuthHeader.length === 2 &&
      splitAuthHeader[0].toLowerCase() === "bearer"
    ) {
      const token = req.headers.authorization?.split(" ")[1];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decodedJwt: any = jwt.verify(token, process.env.JWT_SECRET);
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
    "/graphqlPrivate",
    authorization,
    graphqlHTTP({
      schema: privateSchema, // private due to authorization
      graphiql: true,
    })
  );

  app.use(
    "/graphql",
    graphqlHTTP(async (req: Request, res) => {
      const jwtData = await getDataFromRequest(req);
      const userRole = jwtData ? (jwtData.userRole as UserRole) : UserRole.USER;
      const userId = jwtData ? jwtData.userId : undefined;

      return {
        schema: getAuthenticatedSchema(userRole),
        graphiql: true,
        context: {
          req: req,
          res: res,
          subdomain: getSubdomainFromRequest(req),
          userRole,
          userId,
        },
      };
    })
  );
  return app;
}

export default createApp;
