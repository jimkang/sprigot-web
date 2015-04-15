var Director = {
  sprigController: null,
  initialTargetSprigId: null,
  initialTargetDocId: null,
  store: createStore()
};

Director.setUpController = function setUpController(opts, done) {
  var expectedType = opts.format ? opts.format : 'sprigot';

  if (!this.sprigController || 
    this.sprigController.controllerType !== expectedType) {

    if (opts.format === 'bloge') {
      this.sprigController = createSpriglog(opts);
    }
    else if (opts.format === 'newdoc') {
      this.sprigController = createNewDocForm(opts);
    }
    else {
      this.sprigController = createSprigot(opts);
    }

    this.sprigController.init(done);
  }
  else {
    this.sprigController.opts = opts;
    setTimeout(done, 0);
  }
};

Director.direct = function direct(locationHash) {
  var opts = this.dictFromQueryString(this.queryStringFromHash(locationHash));
  var pathSegments = locationHash.split('/');

  if (pathSegments.length > 0 && pathSegments[1] === 'new') {
    opts.format = 'newdoc';
    opts.loadDone = this.loadDone.bind(this);
    this.setUpController(opts, this.callLoad.bind(this));
  }
  else {    
    // Paths other than newdoc require that the doc (without its tree) 
    // be loaded before deciding which controller to use.
    if (pathSegments.length < 2 || !pathSegments[1]) {
      // No docId specified.
      this.initialTargetDocId = Settings.defaultDoc;
    }
    else {
      this.initialTargetDocId = pathSegments[1];
    }

    this.store.getDoc(this.initialTargetDocId, function gotDoc(error, doc) {
      if (error) {
        // TODO: Load error controller.
        console.log('Error', error);
      }
      else if (!doc) {
        console.log('Could not find doc', this.initialTargetDocId);
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
        opts.loadDone = this.loadDone.bind(this);
        this.setUpController(opts, this.callLoad.bind(this));
      }
    }
    .bind(this));
  }
};

Director.loadDone = function loadDone(error) {
  if (error) {
    console.log('Error while loading:', error);
  }
};

Director.callLoad = function callLoad() {
  this.sprigController.load();
};

Director.respondToHashChange = function respondToHashChange() {
  this.direct(location.hash);
};

Director.init = function init() {
  this.direct(location.hash);
  window.onhashchange = this.respondToHashChange.bind(this);
};

Director.queryStringFromHash = function queryStringFromHash(locationHash) {
  var queryString = null;
  var linkParts = locationHash.split('?');
  if (linkParts.length > 1) {
    queryString = linkParts[1];
  }
  return queryString;
};

Director.dictFromQueryString = function dictFromQueryString(queryString) {
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
};

Director.init();
