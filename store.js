var TextStuff = require('./textstuff');
var createAPIEnvoy = require('./apienvoy');
var idmaker = require('idmaker');
var D3SprigBridge = require('./d3sprigbridge');
var exportMethods = require('export-methods');

function createStore() {
  var currentApiEnvoy = createAPIEnvoy('http://192.241.250.38:4000');
  var legacyApiEnvoy = createAPIEnvoy('http://192.241.250.38:3003');

  function getApiEnvoyForDoc(docId) {
    return docIsLegacy(docId) ? legacyApiEnvoy : currentApiEnvoy;
  }

  var legacyDocs = [
    'The-Disappearance-of-N',
    'About',
    'resume'
  ];

  function docIsLegacy(docId) {
    return legacyDocs.indexOf(docId) !== -1;
  }

  function saveSprigFromTreeNode(node, docId) {
    var serializedNode = null;
    if (node) {
      serializedNode = D3SprigBridge.serializeTreedNode(node);
    }
    if (serializedNode) {
      var saveId = TextStuff.makeId(4);
      var body = {};
      serializedNode.doc = docId;
      body[saveId] = {
        op: 'saveSprig',
        params: serializedNode
      };

      getApiEnvoyForDoc(docId).request(body, logResults);
    }

    function logResults(error, response) {
      if (error) {
        console.log('Error while saving sprig:', error);
        return;
      }

      if (saveId in response && response[saveId].status === 'saved') {
        console.log('Sprig saved:', response);
      }
      else {
        console.log('Sprig not saved.');
      }
    }    
  }

  function saveChildAndParentSprig(child, parent) {
    var body = {};
    body.saveChildSprigOp = {
      op: 'saveSprig',
      params: child
    };
    body.saveParentSprigOp = {
      op: 'saveSprig',
      params: parent
    };

    getApiEnvoyForDoc(child.doc).request(body, logResults);

    function logResults(error, response) {
      if (error) {
        console.log('Error while saving sprigs:', error);
        return;
      }

      console.log('Child sprig save status:', response.saveChildSprigOp.status);
      console.log(
        'Parent sprig save status:', response.saveParentSprigOp.status
      );
    }
  }

  function deleteChildAndSaveParentSprig(child, parent) {
    var requestBody = {};

    requestBody.deleteChildSprigOp = {
      op: 'deleteSprig',
      params: child
    };
    requestBody.saveParentSprigOp = {
      op: 'saveSprig',
      params: parent
    };
    
    getApiEnvoyForDoc(child.doc).request(requestBody, logResults);

    function logResults(error, response) {
      if (error) {
        console.log('Error while saving sprigs:', error);
        return;
      }

      console.log('Sprig deletion status:', response.deleteChildSprigOp.status);
      console.log(
        'Parent sprig save status:', response.saveParentSprigOp.status
      );
    }
  }

  function getDoc(docId, outerDone) {
    var sprigRequest = {
      op: 'getDoc',
      params: {
        id: docId,
        childDepth: 0
      }
    };

    getApiEnvoyForDoc(docId).request({getDocReq: sprigRequest}, logResults);

    function logResults(error, response) {
      if (error) {
        if (outerDone) {
          outerDone(error, null);
        }
        return;
      }

      if ('getDocReq' in response && response.getDocReq.status === 'got') {
        if (outerDone) {
          outerDone(null, response.getDocReq.result);
        }
      }
      else {
        if (outerDone) {
          outerDone(null, null);
        }
      }
    }
  }

  function getSprigTree(docId, format, outerDone) {
    var sprigRequest = {
      op: 'getDoc',
      params: {
        id: docId,
        childDepth: 40
      }
    };

    if (format) {
      sprigRequest.params.filterByFormat = format;
    }

    getApiEnvoyForDoc(docId).request({getDocReq: sprigRequest}, logResults);

    function logResults(error, response) {
      if (error) {
        if (outerDone) {
          outerDone(error, null);
        }
        return;
      }

      if ('getDocReq' in response && response.getDocReq.status === 'got') {
        if (outerDone) {
          outerDone(null, response.getDocReq.result.sprigTree);
        }
      }
      else {
        if (outerDone) {
          outerDone(null, null);
        }
      }
    }
  }

  function getSprigList(docId, format, outerDone) {
    var sprigRequest = {
      op: 'getDoc',
      params: {
        id: docId,
        flatten: true
      }
    };

    if (format) {
      sprigRequest.params.filterByFormat = format;
    }


    getApiEnvoyForDoc(docId).request({getDocReq: sprigRequest}, logResults);

    function logResults(error, response) {
      if (error) {
        if (outerDone) {
          outerDone(error, null);
        }
        return;
      }

      if ('getDocReq' in response && response.getDocReq.status === 'got') {
        if (outerDone) {
          outerDone(null, response.getDocReq.result.sprigList);
        }
      }
      else {
        if (outerDone) {
          outerDone(null, null);
        }
      }
    }
  }

  function createNewDoc(docParams, rootSprigParams, done) {
    var requestBody = {};
    var docCreateReqId = 'docCreateReq' + idmaker.randomId(4);
    var rootSprigSaveReqId = 'rootSprigSaveReq' + idmaker.randomId(4);

    requestBody[docCreateReqId] = {
      op: 'saveDoc',
      params: docParams
    };

    requestBody[rootSprigSaveReqId] = {
      op: 'saveSprig',
      params: rootSprigParams
    };

    currentApiEnvoy.request(requestBody, done);
  }

  return exportMethods(
    saveSprigFromTreeNode,
    saveChildAndParentSprig,
    deleteChildAndSaveParentSprig,
    getDoc,
    getSprigTree,
    getSprigList,
    createNewDoc
  );
}

module.exports = createStore;
