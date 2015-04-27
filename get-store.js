var isLegacy = require('./is-legacy');
var legacyStore = require('./legacy-store');
var createStore = require('./store');

function getStoreForDoc(docId) {
  if (isLegacy(docId)) {
    return legacyStore;
  }
  else {
    return createStore();
  }
}

module.exports = getStoreForDoc;
