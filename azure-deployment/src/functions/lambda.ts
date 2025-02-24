
import { app } from '@azure/functions';
import { createApp, appStart } from 'abe-gql-core'
import {createHandler} from 'azure-function-express'

async function initializeApp() {
    await appStart();
    return createApp();
  }

let serverlessHandler: any;

async function gqlHandler(context: any, req: any) {
  if (!serverlessHandler) {
    const app = await initializeApp();
    serverlessHandler = createHandler(app);
  }
  return serverlessHandler(context, req);
}

app.http('HttpStart', {
    route: 'api/HttpStart',
    methods: ['GET', 'POST'],
    authLevel: 'function',
    handler: gqlHandler
});