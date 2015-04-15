function createGraph() {

var Graph = {
  camera: null,
  treeRenderer: null,
  treeNav: null,
  textStuff: null,
  historian: null,
  sprigot: null,

  pane: null,
  board: null,
  svgRoot: null,
  focusEl: null,
  focusNode: null,
  nodeRoot: null,
  collisionFinder: null,
  margin: {top: 20, right: 10, bottom: 20, left: 10}
};

Graph.init = function init(sprigotSel, camera, treeRenderer, 
  textStuff, historian, sprigot) {

  this.camera = camera;
  this.treeRenderer = treeRenderer;
  this.treeNav = createTreeNav();
  this.textStuff = textStuff;
  this.historian = historian;
  this.sprigot = sprigot;

  this.pane = sprigotSel.append('div')
    .attr('id', 'graphPane')
    .classed('pane', true);

  this.board = this.pane.append('svg')
    .attr({
      id: 'svgBoard',
      width: '100%',
      height: '85%'
    });

  // this.setUpFilters();

  this.board.append('g').attr('id', 'background')
    .append('rect').attr({
      width: '100%',
      height: '100%',
      fill: 'rgba(0, 0, 16, 0.2)'
    });

  this.svgRoot = this.board.append('g').attr({
    id: 'graphRoot',
    transform: 'translate(' + this.margin.left + ',' + this.margin.top + ')'
  });

  this.camera.setUpZoomOnBoard(this.board, this.svgRoot);
  this.setGraphScale();

  var note = this.pane.append('div').attr('id', 'zoom-note')
      .classed('info-note', true);

  if (this.sprigot.isMobile()) {
    note.text('You can pinch to zoom in and out of the graph. Drag to pan.');
  }
  else {
    note.text('You can use the mouse wheel to zoom in and out of the graph. Drag to pan.');    
  }

  this.collisionFinder = createCollisionFinder(this.board.node());

  return this;
};

Graph.setUpFilters = function setUpFilters() {
  var filter = this.board.append('defs').append('filter').attr({
    id: 'text-glow',
    x: '-20%',
    y: '-20%',
    width: '140%',
    height: '140%'
  });
  filter.append('feGaussianBlur').attr({
    in: 'SourceAlpha',
    stdDeviation: 4,
    result: 'blurOut'
  });

  var transferPrimitive = filter.append('feComponentTransfer').attr({
    in: 'blurOut',
    result: 'increaseOpacityOut'
  });
  transferPrimitive.append('feFuncA').attr({
    type: 'gamma',
    exponent: 0.7,
    amplitude: 0.8,
  });

  var mergePrimitive = filter.append('feMerge');
  mergePrimitive.append('feMergeNode').attr('in', 'increaseOpacityOut');
  mergePrimitive.append('feMergeNode').attr('in', 'SourceGraphic');
};

Graph.loadNodeTreeToGraph = function loadNodeTreeToGraph(nodeTree, 
  identifyFocusSprig, done) {

  this.nodeRoot = nodeTree;

  this.treeRenderer.init(this.nodeRoot, this);
  this.treeNav.init(this.nodeRoot, this.camera, TreeRenderer, this, 
    this.textStuff);

  var height = 
    this.board.node().clientHeight - this.margin.top - this.margin.bottom;
  this.nodeRoot.x0 = height / 2;
  this.nodeRoot.y0 = 0;

  this.treeNav.collapseRecursively(this.nodeRoot);
  var focusSprig = this.nodeRoot;

  this.treeRenderer.update(this.nodeRoot);

  var shouldPanToRoot = true;

  if (identifyFocusSprig) {
    var pathToSprig = D3SprigBridge.mapPathInD3Tree(identifyFocusSprig, 
      this.nodeRoot, 100);

    if (pathToSprig.length > 0) {
      this.treeNav.followPathToSprig(pathToSprig);
      focusSprig = pathToSprig[pathToSprig.length - 1];
      shouldPanToRoot = false;
    }
  }

  if (shouldPanToRoot) {
    setTimeout(function initialPan() {
      this.panToRoot();
      if (this.focusNode) {
        Historian.syncURLToSprigId(this.focusNode.id);
      }  
    }
    .bind(this),
    900);
  }

  setTimeout(function initialTextShow() {
    this.noteNodeWasVisited(focusSprig);
    this.textStuff.initialShow(focusSprig);
    done();
  }
  .bind(this),
  800);
};

Graph.panToRoot = function panToRoot() {
  var focusSel = d3.select('#' + this.nodeRoot.id);
  this.setFocusEl(focusSel.node());
  this.camera.panToElement(focusSel);
};

Graph.setGraphScale = function setGraphScale() {
  var actualBoardHeight = this.camera.getActualHeight(this.board.node());

  if (actualBoardHeight <= 230) {
    this.camera.rootSelection.attr('transform', 'translate(0, 0) scale(0.75)');
    this.camera.zoomBehavior.scale(0.5);
  }
};

Graph.setFocusEl = function setFocusEl(el) {
  this.focusEl = el;
  this.focusNode = d3.select(this.focusEl).datum();
};

Graph.focusOnTreeNode = function focusOnTreeNode(treeNode, el, done) {
  this.setFocusEl(el);
  var previouslyVisited = this.noteNodeWasVisited(treeNode);
  if (!previouslyVisited) {
    this.noteNodeWasVisited(treeNode);
  }
  this.historian.syncURLToSprigId(treeNode.id);
  this.treeRenderer.update(this.nodeRoot);
  this.camera.panToElement(d3.select(this.focusEl), done);
};

Graph.focusOnSprig = function focusOnSprig(sprigId, delay, done) {
  if (!delay) {
    delay = 500;
  }
  var sprigSel = d3.select('#' + sprigId);

  setTimeout(function doFocus() {
    this.focusOnTreeNode(sprigSel.datum(), sprigSel.node(), done);
  }
  .bind(this),
  delay);
};

Graph.nodeHasFocus = function nodeHasFocus(treeNode) {
  return (treeNode === this.focusNode);
};

Graph.noteNodeWasVisited = function noteNodeWasVisited(treeNode) {
  var visitKey = 'visited_' + treeNode.id;
  localStorage[visitKey] = true;
};

Graph.nodeWasVisited = function nodeWasVisited(treeNode) {
  var visitKey = 'visited_' + treeNode.id;
  return (visitKey in localStorage);
};

Graph.nodeIsUnvisited = function nodeIsUnvisited(sprig) {
  return !this.nodeWasVisited(sprig);
};

Graph.documentIsEditable = function documentIsEditable() {
  return this.textStuff.editAvailable;
};

Graph.nodeWasDragged = function nodeWasDragged(node, nodeEl) {
  if (this.documentIsEditable()) {
    var collidingEls = this.collisionFinder.elementsHittingEl(nodeEl);
    function elOtherHasTreeNodeData(el) {
      return (typeof el.__data__ === 'object' && 
        typeof el.__data__.id === 'string' &&  el.__data__.id !== node.id);
    }
    console.log('collidingEls', collidingEls);
    var otherEl = _.find(collidingEls, elOtherHasTreeNodeData);
    if (otherEl) {
      if (this.sprigot.metaPressed) {        
        this.swapNodeTreePositions(node, otherEl.__data__);
      }
      else {
        this.moveNodeToNewParent(node, otherEl.__data__);        
      }
    }
  }
};

Graph.swapNodeWithSibling = function swapNodeWithSibling(node, direction) {
  if (typeof node.parent === 'object' && 
    typeof node.parent.children === 'object') {

    var nodeIndex = _.indexOf(node.parent.children, node);
    var newIndex = nodeIndex + direction;
    if (newIndex > -1 && newIndex < node.parent.children.length) {
      var swapee = node.parent.children[newIndex];
      node.parent.children[nodeIndex] = swapee;
      node.parent.children[newIndex] = node;
      this.sprigot.store.saveSprigFromTreeNode(node.parent, node.parent.doc);
    }
  }
};

Graph.swapNodeTreePositions = function swapNodeTreePositions(node1, node2) {  
  if (typeof node1.parent !== 'object' || typeof node2.parent !== 'object') {
    // Can't swap the root node with anything.
    return;
  }

  if (typeof node1.parent.children !== 'object') {
    node1.parent.children = [];
  }
  node1.parent.children[node1.parent.children.indexOf(node1)] = node2;

  if (typeof node2.parent.children !== 'object') {
    node2.parent.children = [];
  }
  node2.parent.children[node2.parent.children.indexOf(node2)] = node1;

  this.treeRenderer.update(this.nodeRoot);

  this.sprigot.store.saveSprigFromTreeNode(node1.parent, node1.parent.doc);
  this.sprigot.store.saveSprigFromTreeNode(node2.parent, node2.parent.doc);
};

Graph.moveNodeToNewParent = function moveNodeToNewParent(child, parent) {
  if (child.parent.id === parent.id) {
    return;
  }

  if (typeof child.parent === 'object') {
    var childCollection = child.parent.children;
    if (!childCollection) {
      childCollection = child.parent._children;
    }
    if (typeof childCollection === 'object') {
      childCollection.splice(childCollection.indexOf(child), 1);
    }
  }

  var parentChildCollection = parent.children;
  if (!parentChildCollection) {
    parentChildCollection = parent._children;
  }
  if (!parentChildCollection || typeof parentChildCollection !== 'object') {
    parent.children = [];
    parentChildCollection = parent.children;
  }
  parentChildCollection.push(child);

  var oldParent = child.parent;
  child.parent = parent;

  this.treeRenderer.update(this.nodeRoot);

  this.sprigot.store.saveSprigFromTreeNode(parent, parent.doc);
  this.sprigot.store.saveSprigFromTreeNode(oldParent, oldParent.doc);  
};

return Graph;
}

