BIN = node_modules/.bin
PRODDIR = ../sprigot

test:
	node tests/basictests.js

D3SRC = node_modules/d3/src

D3_LIBRARY_FILES = \
	$(D3SRC)/start.js \
	$(D3SRC)/compat/index.js \
	$(D3SRC)/selection/selection.js \
	$(D3SRC)/transition/index.js \
	$(D3SRC)/event/mouse.js \
	$(D3SRC)/scale/linear.js \
	$(D3SRC)/behavior/zoom.js \
	$(D3SRC)/behavior/drag.js \
	$(D3SRC)/layout/tree.js \
	$(D3SRC)/svg/diagonal.js \
	$(D3SRC)/end.js

smash: $(D3_LIBRARY_FILES)
	$(BIN)/smash $(D3_LIBRARY_FILES) > lib/d3-small.js

run:
	wzrd index.js:sprigot-web.js -- \
		-d

css:
	$(BIN)/myth sprig-src.css sprig.css

css-watch:
	$(BIN)/myth --watch sprig-src.css sprig.css

build:
	$(BIN)/browserify index.js | $(BIN)/uglifyjs -c -m --keep-fnames -o sprigot-web.js

build-unminified: smash css
	$(BIN)/browserify index.js > sprigot-web.js

run-built-app:
	python -m SimpleHTTPServer

deploy:
	cp sprigot-web.js $(PRODDIR) && \
	cp *.css $(PRODDIR) && \
	cp index.html $(PRODDIR) && \
	git checkout index.html
