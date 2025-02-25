const serverlessExpress = require('@codegenie/serverless-express')
const {createApp} = require('abe-gql-core')

const app = createApp();
const cachedServerlessExpress = serverlessExpress({ app })

module.exports = async function (context, req) {
  return cachedServerlessExpress(context, req)
}
