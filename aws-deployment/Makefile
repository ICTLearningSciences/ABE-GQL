ENV ?= dev

.PHONY: update-core
update-core:
	cd ../abe-gql-core && npm ci && npm run build

.PHONY: deploy
deploy:
	make update-core
	npm run deploy:$(ENV)

