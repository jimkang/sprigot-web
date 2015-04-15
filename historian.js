var Historian = {
  docNav: null,
  docId: null
};

// docNavigator is expected to have a goToSprigId method.
Historian.init = function init(docNavigator, docId) {
  this.docNav = docNavigator;
  this.docId = docId;
  window.onpopstate = this.statePopped.bind(this);
};

Historian.statePopped = function statePopped(e) {
  if (e.state) {
    this.docId = e.state.docId;
    this.docNav.goToSprigId(e.state.sprigId, 100);
  }
};

Historian.syncURLToSprigId = function syncURLToSprigId(sprigId) {
  if (typeof window.history.state === 'object' &&
    window.history.state &&
    typeof window.history.state.docId === 'string' &&
    typeof window.history.state.sprigId === 'string' && 
    window.history.state.docId === this.docId &&
    window.history.state.sprigId === sprigId) {
    return;
  }

  var docPath = this.docId + '/';
  if (Settings.defaultDoc && this.docId === Settings.defaultDoc) {
    docPath = '';
  }
  var newURL = location.protocol + '//' + location.host + location.pathname +
    '#/' + docPath + sprigId;

  var hashParts = location.hash.split('?');
  if (hashParts.length > 1) { 
    newURL += ('?' + hashParts[1]); 
  }

  window.history.pushState({
    docId: this.docId,
    sprigId: sprigId
  },
  null, newURL);  
};

