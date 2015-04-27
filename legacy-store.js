var createAPIEnvoy = require('./apienvoy');
var idmaker = require('idmaker');
var D3SprigBridge = require('./d3sprigbridge');

var apiEnvoy = createAPIEnvoy('http://192.241.250.38:3003');

function saveSprigFromTreeNode(node, docId) {
  var serializedNode = null;
  if (node) {
    serializedNode = D3SprigBridge.serializeTreedNode(node);
  }
  if (serializedNode) {
    var saveId = idmaker.randomId(4);
    var body = {};
    serializedNode.doc = docId;
    body[saveId] = {
      op: 'saveSprig',
      params: serializedNode
    };

    apiEnvoy.request(body, logResults);    
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

  apiEnvoy.request(body, logResults);

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
  
  apiEnvoy.request(requestBody, logResults);

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

  apiEnvoy.request({getDocReq: sprigRequest}, logResults);
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

  apiEnvoy.request({getDocReq: sprigRequest}, logResults);
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


  apiEnvoy.request({getDocReq: sprigRequest}, logResults);
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

  apiEnvoy.request(requestBody, done);
}

module.exports = {
  saveSprigFromTreeNode: saveSprigFromTreeNode,
  saveChildAndParentSprig: saveChildAndParentSprig,
  deleteChildAndSaveParentSprig: deleteChildAndSaveParentSprig,
  getDoc: getDoc,
  getSprigTree: getSprigTree,
  getSprigList: getSprigList,
  createNewDoc: createNewDoc
};
