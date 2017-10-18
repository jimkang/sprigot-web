var idmaker = require('idmaker');
var d3 = require('./lib/d3-small');
var createStrokeRouter = require('strokerouter');
var renderAdminPanel = require('./render-admin-panel');
var getStoreForDoc = require('./get-store');
var createPaneShiftControl = require('./pane-shift-control');
var createPaneShifter = require('./pane-shifter');
var isMobile = require('./is-mobile');

var TextStuff = {
  graph: null, 
  treeRenderer: null,
  store: null,
  sprigot: null,
  contentZoneStrokeRouter: null,

  pane: null,
  textpane: null,
  textcontent: null,
  titleField: null,
  contentZone: null,
  findUnreadLink: null,
  showGraphLink: null,
  downLink: null,
  // editAvailable: true
  editAvailable: false
};

TextStuff.init = function init(sprigotSel, graph, treeRenderer, sprigot) {
  this.graph = graph;
  this.treeRenderer = treeRenderer;
  this.sprigot = sprigot;

  this.pane = sprigotSel.append('div')
    .classed('pane', true).attr('id', 'nongraphPane');
  
  this.pane.append('div').attr('id', 'questionDialog');
  
  this.textpane = this.pane.append('div').attr('id', 'textpane')
    .classed('textpane', true);
  
  this.contentZone = this.textpane.append('div').classed('contentZone', true)
    .style('display', 'none');

  this.titleField = this.contentZone.append('span')
    .classed('sprigTitleField', true).style('display', 'none');
  this.textcontent = this.contentZone.append('div').classed('textcontent', true)
    .attr('tabindex', 0);

  if (this.editAvailable) {
    renderAdminPanel({
      root: this.textpane,
      responders: {
        respondToEmphasisCheckChange: this.respondToEmphasisCheckChange.bind(this),
        respondToTagsChange: this.respondToTagsChange.bind(this),
        respondToFormatsChange: this.respondToFormatsChange.bind(this),
        respondToAddChildSprigCmd: sprigot.respondToAddChildSprigCmd.bind(sprigot),
        respondToNewSprigotCmd: sprigot.respondToNewSprigotCmd.bind(sprigot),
        respondToDeleteSprigCmd: sprigot.respondToDeleteSprigCmd.bind(sprigot),
        respondToMoveChildLeftCmd: sprigot.respondToMoveChildLeftCmd.bind(sprigot),
        respondToMoveChildRightCmd: sprigot.respondToMoveChildRightCmd.bind(sprigot)
      }
    });
  }

  this.initFindUnreadLink();
  // Other controls can be init'ed here.

  d3.selectAll('#textpane .contentZone,.editcontrol').style('display', 'none');

  if (this.editAvailable) {
    this.textcontent.on('click', this.startEditing.bind(this));
    this.titleField.on('click', this.startEditing.bind(this));

    this.contentZoneStrokeRouter = createStrokeRouter(this.contentZone.node());
    this.contentZoneStrokeRouter.routeKeyDown('enter', ['meta'], 
      this.endEditing.bind(this));
    this.contentZoneStrokeRouter.absorbAllKeyUpEvents = true;
  }

  this.paneShifter = createPaneShifter({
    state: isMobile() ? 'collapsed' : 'half-expanded',
    pane: this.pane,
    expandDirection: -1
  });

  this.paneShiftControl = createPaneShiftControl({
    parent: this.pane,
    onClick: this.paneShifter.toggle,
    expandDirection: -1
  });

  this.paneShiftControl.render();
};

TextStuff.initFindUnreadLink = function initFindUnreadLink() {
  this.findUnreadLink = this.pane.append('a')
    .attr('id', 'findunreadlink')
    .classed('control-link', true)
    .classed('findunread-link', true)
    .text('Find Unread')
    .style('display', 'none')
    .on('click', this.sprigot.respondToFindUnreadCmd.bind(this.sprigot));
};

TextStuff.syncTextpaneWithTreeNode = function syncTextpaneWithTreeNode(
  treeNode, uncollapseDelay) {

  this.textcontent.datum(treeNode);
  this.titleField.datum(treeNode);

  this.textcontent.html(treeNode.body);
  this.titleField.html(treeNode.title);

  if (this.editAvailable) {
    var eventData = {
      detail: {
        focusNode: treeNode
      }
    };
    document.dispatchEvent(new CustomEvent('node-focus-change', eventData));
  }

  this.uncollapseTextpane(uncollapseDelay);
}

TextStuff.showTextpaneForTreeNode = function showTextpaneForTreeNode(treeNode) {
  this.syncTextpaneWithTreeNode(treeNode);

  d3.selectAll('#textpane .contentZone,.editcontrol').style('display', 'block');
  this.contentZone.style('display', 'block');
  this.uncollapseTextpane();
}

TextStuff.fadeInTextPane = function fadeInTextPane(transitionTime) {
  if (this.contentZone.style('display') === 'none') {
    var textpaneEditControls = 
      d3.selectAll('#textpane .contentZone,.editcontrol');
    this.textpane.style('opacity', 0);
    textpaneEditControls.style('opacity', 0);
    this.contentZone.style('opacity', 0);

    textpaneEditControls.style('display', 'block')
      .transition().duration(transitionTime)
      .style('opacity', 1);

    this.contentZone.style('display', 'block')
      .transition().duration(transitionTime)
      .style('opacity', 1);

    this.textpane
      .transition().duration(transitionTime)
      .style('opacity', 1);
  }
}

TextStuff.fadeInControlLinks = function fadeInControlLinks(transitionTime) {
  var controlLinks = d3.selectAll('#nongraphPane .control-link');
  controlLinks.style('opacity', 0);
  controlLinks.style('display', 'block')
    .transition().duration(transitionTime)
    .style('opacity', 1);
}

TextStuff.initialShow = function initialShow(treeNode) {
  var uncollapseDelay = 0;
  if (isMobile()) {
    uncollapseDelay = 1500;
  }
  setTimeout(function doIt() {
    this.syncTextpaneWithTreeNode(treeNode, uncollapseDelay);
    this.fadeInTextPane(750);
    this.fadeInControlLinks(800);
  }
  .bind(this),
  725);
}

TextStuff.uncollapseTextpane = function uncollapseTextpane(uncollapseDelay) {
  var textPaneIsCollapsed = this.pane.classed('collapsed');
  var expandState = 'half-expanded';

  if (textPaneIsCollapsed) {
    if (isMobile()) {
      if (!uncollapseDelay) {
        uncollapseDelay = 1500;
      }
      expandState = 'fully-expanded';
      setTimeout(expandTextPane.bind(this), uncollapseDelay);
    }
    else {
      if (isNaN(uncollapseDelay)) {
        uncollapseDelay = 0;
      }
      setTimeout(expandTextPane.bind(this), uncollapseDelay);
    }
  }

  function expandTextPane() {
    this.paneShifter.syncToState(expandState);
  }
}

TextStuff.showTitle = function showTitle() {
  this.titleField.text(this.titleField.datum().title);
  this.titleField.style('display', 'block');
}

TextStuff.disableFindUnreadLink = function disableFindUnreadLink() {
  this.findUnreadLink.text('You\'ve read all the sprigs!');
  this.findUnreadLink.transition().duration(700)
    .style('opacity', 0.3)
    .style('cursor', 'default')
    .attr('href', null);

  this.findUnreadLink.transition().delay(3000).duration(2000)
    .style('opacity', 0);
};

/* Editing */

TextStuff.makeId = function makeId(lengthOfRandomPart) {
  return 's' + idmaker.randomId(lengthOfRandomPart);
}

TextStuff.changeEditMode = function changeEditMode(editable, skipSave) {
  if (!this.editAvailable) {
    return;
  }

  this.textcontent.attr('contenteditable', editable);
  this.titleField.attr('contenteditable', editable);
  this.contentZone.classed('editing', editable);

  if (editable) {
    this.showTitle();
    this.textcontent.node().focus();
    // TODO: Make the cursor bolder? Flash the cursor?
  }
  else {
    this.titleField.style('display', 'none');

    var editedNode = this.textcontent.datum();
    editedNode.body = this.textcontent.html();

    var newTitle = this.titleField.text();
    var titleChanged = (newTitle !== editedNode.title);
    editedNode.title = newTitle;
    if (titleChanged) {
      d3.select('#' + editedNode.id + ' text').text(editedNode.title);
    }

    var eventData = {
      detail: {
        focusNode: editedNode
      }
    };
    document.dispatchEvent(new CustomEvent('node-focus-change', eventData));

    this.textcontent.datum(editedNode);
    this.titleField.datum(editedNode);

    if (!skipSave) {
      var docId = this.sprigot.getOpts().doc.id;
      getStoreForDoc(docId).saveSprigFromTreeNode(
        this.textcontent.datum(), docId
      );
    }
  }
}

TextStuff.endEditing = function endEditing() {
  if (this.contentZone.classed('editing')) {
    this.changeEditMode(false);
  }
}

/* Responders */

TextStuff.respondToEmphasisCheckChange = function respondToEmphasisCheckChange() {
  if (this.graph.focusNode) {
    this.graph.focusNode.emphasize = d3.event.srcElement.checked;
    this.treeRenderer.update(this.graph.nodeRoot);
    this.saveSprigFromFocusNode();
  }
}

TextStuff.respondToTagsChange = function respondToTagsChange() {
  if (this.graph.focusNode) {
    this.graph.focusNode.tags = d3.event.srcElement.value.split(' ');
    this.saveSprigFromFocusNode();
  }
};

TextStuff.respondToFormatsChange = function respondToFormatsChange() {
  if (this.graph.focusNode) {
    this.graph.focusNode.formats = d3.event.srcElement.value.split(' ');
    this.saveSprigFromFocusNode();
  }
};

TextStuff.saveSprigFromFocusNode = function saveSprigFromFocusNode() {
  var docId = this.sprigot.getOpts().doc.id;
  getStoreForDoc(docId).saveSprigFromTreeNode(this.graph.focusNode, docId);
}

TextStuff.startEditing = function startEditing() {
  // d3.event.stopPropagation();
  if (!this.contentZone.classed('editing')) {
    this.changeEditMode(true);
  }
};

module.exports = TextStuff;
