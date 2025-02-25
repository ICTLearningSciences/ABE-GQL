ENV ?= dev
APP_NAME=$(ENV)-abe-function-app-mongo

#login/logout commands
.PHONY: login
login:
	az login

.PHONY: logout
logout:
	az logout

# Run to fetch app settings from Azure
.PHONY: fetch-app-settings
fetch-app-settings:
	func azure functionapp fetch-app-settings $(APP_NAME)

.PHONY: deploy
deploy:
	# npm run build
	func azure functionapp publish $(APP_NAME) --typescript --env $(ENV)

#Develop
.PHONY: develop
develop:
	make fetch-app-settings
	cd ../abe-gql-core && npm run build
	npm install
	func start --inspect-brk --build

