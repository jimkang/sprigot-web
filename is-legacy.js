var legacyDocs = [
  'The-Disappearance-of-N',
  'About',
  'resume''
];

function docIsLegacy(docId) {
  return legacyDocs.indexOf(docId) !== -1;
}

module.exports = docIsLegacy;
