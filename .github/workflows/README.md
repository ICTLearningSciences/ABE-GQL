azure-cd.yml
 - had to create a service principal:
    - $ az ad sp create-for-rbac --name "myGitHubAction" --role contributor --scopes /subscriptions/<subscription-id> --sdk-auth
    - add the output to github secrets as AZURE_CREDENTIALS