Manual deployment:

AWS deployment:
```
cd aws-deployment
make deploy ENV=dev/qa/prod
```

Azure deployment:
```
cd azure-deployment
make deploy ENV=dev/qa/prod
```

AWS Deployment via AWS Pipelines:
1. Make changes and push to main
2. For deploying to AWS Dev, merge changed into aws-dev
3. For deploying to AWS QA, merge changed into aws-release
4. For deploying to AWS Prod, manually approve in AWS CodePipeline




