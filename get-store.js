var legacyStore = require('./legacy-store');
var createStore = require('./store');

var legacyDocs = [
  'The-Disappearance-of-N',
  'About',
  'resume'
];

function docIsLegacy(docId) {
  return legacyDocs.indexOf(docId) !== -1;
}

function getStoreForDoc(docId) {
  if (docIsLegacy(docId)) {
    return legacyStore;
  }
  else {
    return createStore();
  }
}

module.exports = getStoreForDoc;
