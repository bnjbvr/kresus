.PHONY: help install build watch dev lint test check release docker-release docker-nightly-base docker-nightly-dev docker-nightly-prod

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' Makefile | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Globally install a prebuilt version of kresus.
	npm -g install kresus

prod: ## Builds in prod mode. Transpiles ES6 files to ES5, moves files and concatenate them to obtain a usable build.
	npm run build:prod

build: ## Builds in dev mode. Transpiles ES6 files to ES5, moves files and concatenate them to obtain a usable build.
	npm run build:dev

watch: ## As build, but retriggers incremental compilation as the files are changed on disk.
	npm run watch

dev: ## Runs servers that get relaunched whenever a built file changes.
	npm run dev

pretty:
	npm run fix:lint

lint: ## Runs the linter for the server and the client, without warnings.
	npm run check:lint

test: ## Runs all the tests.
	npm run check:test

check: ## Runs all tests and style checks.
	npm run check

release: ## Prepares for a release. To be done only on the `builds` branch.
	npm run release

docker-release: ## Prepares for a Docker release. Must be done after make release.
	docker build -t bnjbvr/kresus -f docker/Dockerfile-stable .

docker-nightly-base: ## Prepares for a Docker nightly base image.
	docker build -t bnjbvr/kresus-nightly-base -f docker/Dockerfile-nightly-base ./docker

docker-nightly-dev: docker-nightly-base ## Prepares for a Docker nightly developer image.
	docker build -t bnjbvr/kresus-nightly-dev -f docker/Dockerfile-nightly-dev ./docker

docker-nightly-prod: docker-nightly-base ## Prepares for a Docker nightly production ready image.
	docker build -t bnjbvr/kresus-nightly-prod -f docker/Dockerfile-nightly-prod ./docker
