// treerenderer is where the click events are actually set up.

function createTreeNav() {

var TreeNav = {
  sprigTree: null,
  graphCamera: null,
  treeRenderer: null,
  graph: null,
  textStuff: null
};

TreeNav.init = function init(sprigTree, camera, treeRenderer, graph, textStuff) {
  this.sprigTree = sprigTree;
  this.graphCamera = camera;
  this.treeRenderer = treeRenderer;
  this.graph = graph;
  this.textStuff = textStuff;
}

TreeNav.chooseTreeNode = function chooseTreeNode(treeNode, treeEl, done) {
  this.expandChildren(treeNode);
  this.graph.focusOnTreeNode(treeNode, treeEl, done);
  this.textStuff.showTextpaneForTreeNode(treeNode);
}

TreeNav.toggleChildren = function toggleChildren(treeNode) {  
  if (treeNode.children) {
    treeNode._children = treeNode.children;
    treeNode.children = null;
  }
  else {
    this.expandChildren(treeNode);
  }
}

TreeNav.expandChildren = function expandChildren(treeNode) {
  if (treeNode._children) {
    treeNode.children = treeNode._children;
    treeNode._children = null;
  }
}

TreeNav.collapseRecursively = function collapseRecursively(treeNode) {
  if (treeNode.children) {
    treeNode._children = treeNode.children;
    treeNode._children.forEach(TreeNav.collapseRecursively);
    treeNode.children = null;
  }
}

TreeNav.nodeIsExpanded = function nodeIsExpanded(treeNode) {
  return (treeNode.children && !treeNode._children);
}

TreeNav.followBranchOfNode = function followBranchOfNode(treeNode) {
  var childNode = null;
  if (typeof treeNode.children === 'object') {
    for (var i = treeNode.children.length - 1; i >= 0; --i) {

      childNode = treeNode.children[i];
      if (typeof childNode.emphasized === 'boolean' && childNode.emphasized) {
        break;
      }
    }
  }

  if (childNode) {
    var childEl = d3.select('#' + childNode.id).node();
    this.chooseTreeNode(childNode, childEl);
  }
}

TreeNav.followParentOfNode = function followParentOfNode(treeNode, done) {
  if (typeof treeNode.parent === 'object') {
    var parentSel = d3.select('#' + treeNode.parent.id);
    this.chooseTreeNode(treeNode.parent, parentSel.node());
    this.graphCamera.panToElement(parentSel, done);
  }
}

// direction should be negative to go to the left, positive to go to the right.
TreeNav.moveToSiblingNode = 
function moveToSiblingNode(treeNode, direction, done) {
  if (typeof treeNode.parent === 'object' &&
    typeof treeNode.parent.children === 'object') {

    var focusIndex = treeNode.parent.children.indexOf(treeNode);
    var siblingIndex = focusIndex + direction;
    if (siblingIndex > -1 && siblingIndex < treeNode.parent.children.length) {
      var siblingNode = treeNode.parent.children[siblingIndex];
      var siblingEl = d3.select('#' + siblingNode.id).node();
      if (siblingNode._children) {
        this.expandChildren(siblingNode);
      }
      this.graph.focusOnTreeNode(siblingNode, siblingEl, done);
      this.textStuff.showTextpaneForTreeNode(siblingNode);
    }
  }
}

TreeNav.goToSprigId = function goToSprigId(sprigId, delay) {
  var pathToSprig = 
    D3SprigBridge.mapPathToSprigId(sprigId, this.sprigTree, 100);

  if (pathToSprig.length > 0) {
    var destNode = pathToSprig[pathToSprig.length-1];
    if (!this.graph.focusNode || destNode.id !== this.graph.focusNode.id) {
      this.followPathToSprig(pathToSprig, delay, function done() {
        this.textStuff.showTextpaneForTreeNode(destNode);
      }
      .bind(this));
    }
  }
}

TreeNav.followPathToSprig = 
function followPathToSprig(pathToSprig, delay, done) {
  if (!delay) {
    var delay = this.treeRenderer.treeNodeAnimationDuration - 200;
  }

  pathToSprig.forEach(function expandSprig(sprig) {
    this.expandChildren(sprig);
  }
  .bind(this));

  this.treeRenderer.update(this.sprigTree, 0);
  this.graph.focusOnSprig(pathToSprig[pathToSprig.length-1].id, delay, done);
}

TreeNav.respondToDownArrow = function respondToDownArrow() {
  d3.event.stopPropagation();
  if (this.nodeIsExpanded(this.graph.focusNode)) {
    this.followBranchOfNode(this.graph.focusNode);
  }
  else {
    this.chooseTreeNode(this.graph.focusNode, 
      d3.select('#' + this.graph.focusNode.id).node());
  }
}

TreeNav.respondToUpArrow = function respondToUpArrow() {
  d3.event.stopPropagation();
  this.followParentOfNode(this.graph.focusNode);
}

TreeNav.respondToLeftArrow = function respondToLeftArrow() {
  d3.event.stopPropagation();
  this.moveToSiblingNode(this.graph.focusNode, -1);
}

TreeNav.respondToRightArrow = function respondToRightArrow() {
  d3.event.stopPropagation();
  this.moveToSiblingNode(this.graph.focusNode, 1);
}


return TreeNav;
}