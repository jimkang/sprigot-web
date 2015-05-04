var createSprigotBaseMixin = require('./sprigotbasemixin');
var createStrokeRouter = require('strokerouter');
var loadATypeKit = require('./load_a_typekit');
var Historian = require('./historian');
var TextStuff = require('./textstuff');
var createGraph = require('./graph');
var TreeRenderer = require('./treerenderer');
var idmaker = require('idmaker');
var D3SprigBridge = require('./d3sprigbridge');
var createCamera = require('./camera');
var d3 = require('./lib/d3-small');
var legacyStore = require('./legacy-store');
var isMobile = require('./is-mobile');

function createSprigot(opts) {
// Expected in opts: doc, loadDone.
// Optional in opts: initialTargetSprigId.

  var graph = null;
  var camera = null;
  var controllerType = 'sprigot';
  var metaPressed = false;
  var docStrokeRouter = null;

  function init(initDone) {
    var baseMixin = createSprigotBaseMixin();
    var addedContainer = baseMixin.setUpOuterContainer('sprig.css', 'sprigot', 
      opts);

    if (!addedContainer) {
      initDone();
      return;
    }

    var cameraScaleExtent = [0.5, 1];
    if (isMobile()) {
      cameraScaleExtent = [0.25, 1];
    }
    camera = createCamera(cameraScaleExtent);
    graph = createGraph();
    var sprigotSel = d3.select('.sprigot');  
    graph.init(sprigotSel, camera, TreeRenderer, TextStuff, Historian,
      this);
    
    TextStuff.init(sprigotSel, graph, TreeRenderer, this);

    initDocEventResponders();

    tagElementsWithCSSHackClasses();

    loadATypeKit('//use.typekit.net/uoo5gyw.js', initDone);
  }

  function load() {
    var rootId = getRootIdFromOpts(opts);
    Historian.init(graph.treeNav, rootId);
    opts.format = undefined;
    legacyStore.getSprigTree(rootId, opts.format, loadTree.bind(this));

    function loadTree(error, tree) {
      if (error) {
        opts.loadDone(error, null);
      }

      if (tree) {
        tree = D3SprigBridge.sanitizeTreeForD3(tree);

        d3.select('title').text('Sprigot - ' + tree.title);          

        var targetId = opts.initialTargetSprigId;
        var matcher = function matchAny() { return true; };
        if (targetId) {
          matcher = function isTarget(sprig) { return (targetId === sprig.id); };
        }

        graph.loadNodeTreeToGraph(tree, matcher, function onGraphLoaded() {
          if (targetId === 'findunread') {
            respondToFindUnreadCmd();
          }
          opts.loadDone();
        }
        .bind(this));
      }
      else {
        opts.loadDone('Sprig tree not found.');
      }
    }
  }

  function initDocEventResponders() {
    var doc = d3.select(document);
    if (TextStuff.editAvailable) {
      doc.on('click', TextStuff.endEditing.bind(TextStuff));
    }
    docStrokeRouter = createStrokeRouter(doc);
    docStrokeRouter.stopPropIfResponderFound = false;

    docStrokeRouter.routeKeyUp('escape', null, function stopEditing() {
      if (TextStuff.contentZone.classed('editing')) {
        TextStuff.changeEditMode(false);
      }
    });
    docStrokeRouter.routeKeyUp('e', null, function startEditing() {
      if (TextStuff.contentZone.style('display') === 'block') {
        TextStuff.changeEditMode(true);
      }    
    });
    docStrokeRouter.routeKeyUp('downArrow', null, 
      graph.treeNav.respondToDownArrow.bind(graph.treeNav));
    docStrokeRouter.routeKeyUp('upArrow', null, 
      graph.treeNav.respondToUpArrow.bind(graph.treeNav));
    docStrokeRouter.routeKeyUp('leftArrow', null, 
      graph.treeNav.respondToLeftArrow.bind(graph.treeNav));
    docStrokeRouter.routeKeyUp('rightArrow', null, 
      graph.treeNav.respondToRightArrow.bind(graph.treeNav));
    // equal + shift is '+'.
    docStrokeRouter.routeKeyUp('equal', ['shift'], 
      respondToAddChildSprigCmd.bind(this));
    docStrokeRouter.routeKeyUp('u', null, 
      respondToFindUnreadCmd.bind(this));
    // docStrokeRouter.routeKeyDown('backspace', ['meta'], 
    //   TextStuff.showDeleteSprigDialog.bind(TextStuff));
  }

  function respondToAddChildSprigCmd() {
    d3.event.stopPropagation();
    if (TextStuff.contentZone.classed('editing')) {
      TextStuff.changeEditMode(false);
    }

    var rootId = getRootIdFromOpts(opts);

    var currentJSONDate = (new Date()).toJSON();
    var newSprig = {
      id: TextStuff.makeId(8),
      title: 'New Sprig',
      body: '',
      created: currentJSONDate,
      modified: currentJSONDate 
    };

    var currentChildren = graph.focusNode.children;
    if (!currentChildren) {
      currentChildren = graph.focusNode._children;
    }
    if (!currentChildren) {
      currentChildren = [];
    }
    currentChildren.push(newSprig);

    graph.focusNode.children = currentChildren;

    TextStuff.changeEditMode(true);

    legacyStore.saveChildAndParentSprig(newSprig, 
      D3SprigBridge.serializeTreedNode(graph.focusNode));

    TreeRenderer.update(graph.nodeRoot, 
      graph.treeRenderer.treeNodeAnimationDuration);

    setTimeout(function afterUpdate() {
      graph.focusOnSprig(newSprig.id);
      TextStuff.showTextpaneForTreeNode(newSprig);
    }
    .bind(this),
    graph.treeRenderer.treeNodeAnimationDuration + 100);
  }

  function respondToDeleteSprigCmd() {
    d3.event.stopPropagation();
    if (TextStuff.contentZone.classed('editing')) {
      TextStuff.changeEditMode(false, true);
    }

    var parentNode = graph.focusNode.parent;
    var childIndex = parentNode.children.indexOf(graph.focusNode);
    parentNode.children.splice(childIndex, 1);
    var rootId = getRootIdFromOpts(opts);

    var sprigToDelete = {
      id: graph.focusNode.id,
      doc: rootId
    };

    legacyStore.deleteChildAndSaveParentSprig(
      sprigToDelete, D3SprigBridge.serializeTreedNode(parentNode)
    );

    var treeNav = graph.treeNav;

    TreeRenderer.update(graph.nodeRoot, 
      graph.treeRenderer.treeNodeAnimationDuration);
    setTimeout(function clickOnParentOfDeletedNode() {
      treeNav.chooseTreeNode(parentNode, d3.select('#' + parentNode.id).node());
    },
    graph.treeRenderer.treeNodeAnimationDuration + 500);
  }

  function respondToNewSprigotCmd() {
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
  }

  function respondToFindUnreadCmd() {
    // TODO: Map a direct route between the two nodes.
    var pathToSprig = D3SprigBridge.mapPathInD3Tree(
      graph.nodeIsUnvisited.bind(graph),
      graph.treeNav.sprigTree, 100);

    if (pathToSprig.length > 0) {
      if (pathToSprig.length > 1 || 
        pathToSprig[0].id !== graph.focusNode.id) {

        graph.treeNav.followPathToSprig(pathToSprig);
      }
      var destSprig = pathToSprig[pathToSprig.length-1];
      Historian.syncURLToSprigId(destSprig.id);
      TextStuff.syncTextpaneWithTreeNode(destSprig);
    }
    else {
      TextStuff.disableFindUnreadLink();
    }
  }

  function respondToMoveChildLeftCmd() {
    moveFocusNodeInDirection(-1);
  }

  function respondToMoveChildRightCmd() {
    moveFocusNodeInDirection(1);
  }

  function moveFocusNodeInDirection(direction) {
    graph.swapNodeWithSibling(graph.focusNode, direction);
    TreeRenderer.update(
      graph.nodeRoot, graph.treeRenderer.treeNodeAnimationDuration
    );
  }

  function tagElementsWithCSSHackClasses() {
    if (isMobile() &&
      !navigator.userAgent.match(/(iPad|iPhone);.*CPU.*OS 7_\d/i)) {
      d3.select('.sprigot').classed('is-not-ios-seven', true);
      d3.select('#graphPane').classed('is-not-ios-seven', true);
      // d3.select('.divider').classed('is-not-ios-seven', true);
      d3.select('#nongraphPane').classed('is-not-ios-seven', true);
    }
  }

  return {
    init: init,
    load: load,
    initDocEventResponders: initDocEventResponders,
    respondToAddChildSprigCmd: respondToAddChildSprigCmd,
    respondToDeleteSprigCmd: respondToDeleteSprigCmd,
    respondToNewSprigotCmd: respondToNewSprigotCmd,
    respondToFindUnreadCmd: respondToFindUnreadCmd,
    respondToMoveChildLeftCmd: respondToMoveChildLeftCmd,
    respondToMoveChildRightCmd: respondToMoveChildRightCmd,
    moveFocusNodeInDirection: moveFocusNodeInDirection,
    tagElementsWithCSSHackClasses: tagElementsWithCSSHackClasses,
    opts: opts // TODO: Rewrite textstuff so it doesn't as for this.
  };
}

function getRootIdFromOpts(opts) {
  return opts.doc.id ? opts.doc.id : opts.rootId;
}

module.exports = createSprigot;
