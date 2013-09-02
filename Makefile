PATH := ./node_modules/.bin:${PATH}

.PHONY : init clean build test dist publish

init:
	npm install

clean:
	grunt init

build:
	grunt compile

test:
	grunt test

dist: init clean build test

publish: dist
	npm publish