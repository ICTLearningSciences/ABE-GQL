const serverlessExpress = require('@codegenie/serverless-express')
const {createApp, appStart} = require('abe-gql-core')

let cachedServerlessExpress;
async function initializeApp() {
  if (!cachedServerlessExpress) {
    await appStart();
    const app = createApp();
    cachedServerlessExpress = serverlessExpress({ app })
  }
}

module.exports = async function (context, req) {
  await initializeApp();
  return cachedServerlessExpress(context, req)
}
