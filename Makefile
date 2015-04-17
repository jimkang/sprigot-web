BIN = node_modules/.bin

DEVTAGS = <script\ src="pch.js"><\/script><script\ src="index.js"><\/script>
PRODUCTIONTAGS = <script\ src="sprigot-web.js"><\/script>
PRODDIR = ../sprigotclient

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
	wzrd index.js -- \
		-d \
		-x lodash \
		-x ./lib/d3-small.js

pch: smash # smash-debug
	$(BIN)/browserify \
		-r ./lib/d3-small.js \
		-r lodash \
		-o pch.js

build: smash
	$(BIN)/browserify index.js | $(BIN)/uglifyjs -c -m -o sprigot-web.js

switch-index-to-production:
	sed 's/$(DEVTAGS)/$(PRODUCTIONTAGS)/' index.html | tee index.html

deploy: build switch-index-to-production
	cp sprigot-web.js $(PRODDIR) && \
	cp *.css $(PRODDIR) && \
	cp index.html $(PRODDIR)
