var createSprigotBaseMixin = require('./sprigotbasemixin');
var createStrokeRouter = require('strokerouter');
var loadATypeKit = require('./load_a_typekit');
var Historian = require('./historian');
var createDivider = require('./divider');
var TextStuff = require('./textstuff');
var createGraph = require('./graph');
var TreeRenderer = require('./treerenderer');
var idmaker = require('idmaker');
var D3SprigBridge = require('./d3sprigbridge');
var createCamera = require('./camera');
var d3 = require('./lib/d3-small');
var legacyStore = require('./legacy-store');

function createSprigot(opts) {
// Expected in opts: doc, loadDone.
// Optional in opts: initialTargetSprigId.

var Sprigot = {
  graph: null,
  divider: null,
  camera: null,
  opts: opts,
  controllerType: 'sprigot',
  metaPressed: false,
  docStrokeRouter: null
};

Sprigot.init = function init(initDone) {
  var baseMixin = createSprigotBaseMixin();
  var addedContainer = baseMixin.setUpOuterContainer('sprig.css', 'sprigot', 
    this.opts);

  if (!addedContainer) {
    initDone();
    return;
  }

  var cameraScaleExtent = [0.5, 1];
  if (this.isMobile()) {
    cameraScaleExtent = [0.25, 1];
  }
  this.camera = createCamera(cameraScaleExtent);
  this.graph = createGraph();
  var sprigotSel = d3.select('.sprigot');  
  this.graph.init(sprigotSel, this.camera, TreeRenderer, TextStuff, Historian,
    this);
  this.divider = createDivider();

  this.divider.init(sprigotSel, this.graph, TextStuff, this.camera, this);
  TextStuff.init(sprigotSel, this.graph, TreeRenderer, this, this.divider);

  this.divider.syncExpanderArrow();
  this.initDocEventResponders();

  this.tagElementsWithCSSHackClasses();

  loadATypeKit('//use.typekit.net/uoo5gyw.js', initDone);
};

Sprigot.load = function load() {
  var rootId = getRootIdFromOpts(this.opts);
  Historian.init(this.graph.treeNav, rootId);

  legacyStore.getSprigTree(rootId, this.opts.format, loadTree.bind(this));

  function loadTree(error, tree) {
    if (error) {
      this.opts.loadDone(error, null);
    }

    if (tree) {
      tree = D3SprigBridge.sanitizeTreeForD3(tree);

      d3.select('title').text('Sprigot - ' + tree.title);          

      var targetId = this.opts.initialTargetSprigId;
      var matcher = function matchAny() { return true; };
      if (targetId) {
        matcher = function isTarget(sprig) { return (targetId === sprig.id); };
      }

      this.graph.loadNodeTreeToGraph(tree, matcher, function onGraphLoaded() {
        if (targetId === 'findunread') {
          this.respondToFindUnreadCmd();
        }
        this.opts.loadDone();
      }
      .bind(this));
    }
    else {
      this.opts.loadDone('Sprig tree not found.');
    }
  }
};

Sprigot.initDocEventResponders = function initDocEventResponders() {
  var doc = d3.select(document);
  if (TextStuff.editAvailable) {
    doc.on('click', TextStuff.endEditing.bind(TextStuff));
  }
  this.docStrokeRouter = createStrokeRouter(doc);
  this.docStrokeRouter.stopPropIfResponderFound = false;

  this.docStrokeRouter.routeKeyUp('escape', null, function stopEditing() {
    if (TextStuff.contentZone.classed('editing')) {
      TextStuff.changeEditMode(false);
    }
  });
  this.docStrokeRouter.routeKeyUp('e', null, function startEditing() {
    if (TextStuff.contentZone.style('display') === 'block') {
      TextStuff.changeEditMode(true);
    }    
  });
  this.docStrokeRouter.routeKeyUp('downArrow', null, 
    this.graph.treeNav.respondToDownArrow.bind(this.graph.treeNav));
  this.docStrokeRouter.routeKeyUp('upArrow', null, 
    this.graph.treeNav.respondToUpArrow.bind(this.graph.treeNav));
  this.docStrokeRouter.routeKeyUp('leftArrow', null, 
    this.graph.treeNav.respondToLeftArrow.bind(this.graph.treeNav));
  this.docStrokeRouter.routeKeyUp('rightArrow', null, 
    this.graph.treeNav.respondToRightArrow.bind(this.graph.treeNav));
  // equal + shift is '+'.
  this.docStrokeRouter.routeKeyUp('equal', ['shift'], 
    this.respondToAddChildSprigCmd.bind(this));
  this.docStrokeRouter.routeKeyUp('u', null, 
    this.respondToFindUnreadCmd.bind(this));
  // this.docStrokeRouter.routeKeyDown('backspace', ['meta'], 
  //   TextStuff.showDeleteSprigDialog.bind(TextStuff));
};

Sprigot.respondToAddChildSprigCmd = function respondToAddChildSprigCmd() {
  d3.event.stopPropagation();
  if (TextStuff.contentZone.classed('editing')) {
    TextStuff.changeEditMode(false);
  }

  var rootId = getRootIdFromOpts(this.opts);

  var currentJSONDate = (new Date()).toJSON();
  var newSprig = {
    id: TextStuff.makeId(8),
    title: 'New Sprig',
    body: '',
    created: currentJSONDate,
    modified: currentJSONDate 
  };

  var currentChildren = this.graph.focusNode.children;
  if (!currentChildren) {
    currentChildren = this.graph.focusNode._children;
  }
  if (!currentChildren) {
    currentChildren = [];
  }
  currentChildren.push(newSprig);

  this.graph.focusNode.children = currentChildren;

  TextStuff.changeEditMode(true);

  legacyStore.saveChildAndParentSprig(newSprig, 
    D3SprigBridge.serializeTreedNode(this.graph.focusNode));

  TreeRenderer.update(this.graph.nodeRoot, 
    this.graph.treeRenderer.treeNodeAnimationDuration);

  setTimeout(function afterUpdate() {
    this.graph.focusOnSprig(newSprig.id);
    TextStuff.showTextpaneForTreeNode(newSprig);
  }
  .bind(this),
  this.graph.treeRenderer.treeNodeAnimationDuration + 100);
};

Sprigot.respondToDeleteSprigCmd = function respondToDeleteSprigCmd() {
  d3.event.stopPropagation();
  if (TextStuff.contentZone.classed('editing')) {
    TextStuff.changeEditMode(false, true);
  }

  var parentNode = this.graph.focusNode.parent;
  var childIndex = parentNode.children.indexOf(this.graph.focusNode);
  parentNode.children.splice(childIndex, 1);
  var rootId = getRootIdFromOpts(this.opts);

  var sprigToDelete = {
    id: this.graph.focusNode.id,
    doc: rootId
  };

  legacyStore.deleteChildAndSaveParentSprig(
    sprigToDelete, D3SprigBridge.serializeTreedNode(parentNode)
  );

  var treeNav = this.graph.treeNav;

  TreeRenderer.update(this.graph.nodeRoot, 
    this.graph.treeRenderer.treeNodeAnimationDuration);
  setTimeout(function clickOnParentOfDeletedNode() {
    treeNav.chooseTreeNode(parentNode, d3.select('#' + parentNode.id).node());
  },
  this.graph.treeRenderer.treeNodeAnimationDuration + 500);
};

Sprigot.respondToNewSprigotCmd = function respondToNewSprigotCmd() {
  var newDoc = {
    id: idmaker.randomId(8),
    rootSprig: idmaker.randomId(8),
    authors: [
      'deathmtn'
    ],
    admins: [
      'deathmtn'
    ]    
  };

  var rootSprig = {
    id: newDoc.rootSprig,
    doc: newDoc.id,
    title: 'Root',
    body: 'Hello. Type some stuff here.',
    children: []
  };

  // TODO: When new API is in place, create a separate body and refer to it 
  // from the sprig:
  // var body = {
  //   id: idmaker.randomId('b-' + 8),
  //   body: 'Hello. Type some stuff here.',
  // };


  legacyStore.createNewDoc(newDoc, rootSprig);
};

Sprigot.respondToFindUnreadCmd = function respondToFindUnreadCmd() {
  // TODO: Map a direct route between the two nodes.
  var pathToSprig = D3SprigBridge.mapPathInD3Tree(
    this.graph.nodeIsUnvisited.bind(this.graph),
    this.graph.treeNav.sprigTree, 100);

  if (pathToSprig.length > 0) {
    if (pathToSprig.length > 1 || 
      pathToSprig[0].id !== this.graph.focusNode.id) {

      this.graph.treeNav.followPathToSprig(pathToSprig);
    }
    var destSprig = pathToSprig[pathToSprig.length-1];
    Historian.syncURLToSprigId(destSprig.id);
    TextStuff.syncTextpaneWithTreeNode(destSprig);
  }
  else {
    TextStuff.disableFindUnreadLink();
  }
};

Sprigot.respondToSwitchToGraphCmd = function respondToSwitchToGraphCmd() {
  if (!this.graph.pane.classed('expandedPane')) {
    this.divider.toggleGraphExpansion();
  }
};

Sprigot.respondToMoveChildLeftCmd = function respondToMoveChildLeftCmd() {
  this.moveFocusNodeInDirection(-1);
}

Sprigot.respondToMoveChildRightCmd = function respondToMoveChildRightCmd() {
  this.moveFocusNodeInDirection(1);
}

Sprigot.moveFocusNodeInDirection = function moveFocusNodeInDirection(direction) {
  this.graph.swapNodeWithSibling(this.graph.focusNode, direction);
  TreeRenderer.update(
    this.graph.nodeRoot, this.graph.treeRenderer.treeNodeAnimationDuration
  );
}

Sprigot.isMobile = function isMobile() {
  var isMobileMediaQuery = 'only screen and (max-device-height: 568px)';
  return (window.matchMedia(isMobileMediaQuery).matches);
};

Sprigot.tagElementsWithCSSHackClasses = function tagElementsWithCSSHackClasses() {
  if (this.isMobile() &&
    !navigator.userAgent.match(/(iPad|iPhone);.*CPU.*OS 7_\d/i)) {
    d3.select('.sprigot').classed('is-not-ios-seven', true);
    d3.select('#graphPane').classed('is-not-ios-seven', true);
    d3.select('.divider').classed('is-not-ios-seven', true);
    d3.select('#nongraphPane').classed('is-not-ios-seven', true);
  }
};

return Sprigot;
}

function getRootIdFromOpts(opts) {
  return opts.doc.id ? opts.doc.id : opts.rootId;
}

module.exports = createSprigot;
