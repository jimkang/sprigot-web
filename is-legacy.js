var legacyDocs = [
  'The-Disappearance-of-N',
  'About',
  'resume',
  'resume-full'
];

function docIsLegacy(docId) {
  // return legacyDocs.indexOf(docId) !== -1;
  // For now, disabling new API completely.
  return true;
}

module.exports = docIsLegacy;
