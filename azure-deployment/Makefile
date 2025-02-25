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

.PHONY: update-core
update-core:
	cd ../abe-gql-core && npm install

.PHONY: deploy
deploy:
	make update-core
	func azure functionapp publish $(APP_NAME) --typescript --env $(ENV)

#Develop
.PHONY: develop
develop:
	make fetch-app-settings
	make update-core
	npm install
	func start --inspect-brk --build

