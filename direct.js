var createNewDocForm = require('./newdoc');
var createSpriglog = require('./spriglog');
var createSprigot = require('./sprigot');
var Settings = require('./sprigotclient_settings');
var legacyStore = require('./legacy-store');
var isLegacy = require('./is-legacy');

var sprigController;
var initialTargetSprigId;
var rootId;

// var resumeMode = true;
var resumeMode = false;

function setUpController(opts, done) {
  var expectedType = opts.format ? opts.format : 'sprigot';

  if (!sprigController || 
    sprigController.controllerType !== expectedType) {

    if (resumeMode || opts.format === 'bloge') {
      sprigController = createSpriglog(opts);
    }
    else if (opts.format === 'newdoc') {
      sprigController = createNewDocForm(opts);
    }
    else {
      sprigController = createSprigot(opts);
    }

    sprigController.init(done);
  }
  else {
    sprigController.setOpts(opts);
    setTimeout(done, 0);
  }
}

function direct(locationHash) {
  var opts = dictFromQueryString(queryStringFromHash(locationHash));
  var pathSegments = locationHash.split('/');

  if (pathSegments.length > 0 && pathSegments[1] === 'new') {
    opts.format = 'newdoc';
    opts.loadDone = loadDone;
    setUpController(opts, callLoad);
  }
  else {    
    // Paths other than newdoc require that the doc (without its tree) 
    // be loaded before deciding which controller to use.
    rootId = getRootIdFromPathSegments(pathSegments);
    if (isLegacy(rootId)) {
      if (resumeMode) {
        rootId = 'resume';
      }
      legacyStore.getDoc(rootId, setUpControllerWithDoc);
    }
    else {
      // TODO: New sprigot-controller to replace sprigot.js.
      setUpController({
        format: 'sprigot',
        rootId: rootId,
        initialTargetSprigId: pathSegments[2],
        loadDone: loadDone
      });
    }
  }

  function setUpControllerWithDoc(error, doc) {
    if (error) {
      // TODO: Load error controller.
      console.log('Error', error);
    }
    else if (!doc) {
      console.log('Could not find doc', rootId);
    }
    else {
      if (!opts.format) {
        opts.format = doc.format;
      }
      if (!opts.doc) {
        opts.doc = doc;
      }
      if (pathSegments.length > 1) {
        opts.initialTargetSprigId = pathSegments[2];
      }
      opts.loadDone = loadDone;
      setUpController(opts, callLoad);
    }
  }
}

function getRootIdFromPathSegments(pathSegments) {
  if (pathSegments.length < 2 || !pathSegments[1]) {
    // No id specified.
    return Settings.defaultDoc;
  }
  else {
    return pathSegments[1];
  }
}

function loadDone(error) {
  if (error) {
    console.log('Error while loading:', error);
  }
}

function callLoad() {
  sprigController.load();
}

function respondToHashChange() {
  direct(location.hash);
}

function init() {
  direct(location.hash);
  window.onhashchange = respondToHashChange;
}

function queryStringFromHash(locationHash) {
  var queryString = null;
  var linkParts = locationHash.split('?');
  if (linkParts.length > 1) {
    queryString = linkParts[1];
  }
  return queryString;
}

function dictFromQueryString(queryString) {
  var queryHash = {};
  if (queryString && typeof queryString === 'string') {
    var queryParts = queryString.split('&');
    for (var i = 0; i < queryParts.length; ++i) {
      var queryPart = queryParts[i];
      var keyAndValue = queryPart.split('=');
      if (keyAndValue.length === 2) {
        queryHash[keyAndValue[0]] = keyAndValue[1];
      }
    }
  }
  return queryHash;
}

module.exports = {
  init: init,
  direct: direct
};
