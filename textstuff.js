var TextStuff = {
  graph: null, 
  treeRenderer: null,
  store: null,
  sprigot: null,
  divider: null,
  sprigot: null,
  contentZoneStrokeRouter: null,

  pane: null,
  textpane: null,
  textcontent: null,
  titleField: null,
  contentZone: null,
  addButton: null,
  deleteButton: null,
  newSprigotButton: null,
  emphasizeCheckbox: null,
  tagField: null,
  formatField: null,
  findUnreadLink: null,
  showGraphLink: null,
  downLink: null,
  OKCancelDialog: null,
  // editAvailable: true
  editAvailable: false
};

TextStuff.init = function init(sprigotSel, graph, treeRenderer, store, 
  sprigot, divider) {

  this.graph = graph;
  this.treeRenderer = treeRenderer;
  this.store = store;
  this.sprigot = sprigot;
  this.divider = divider;

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
    this.addButton = this.textpane.append('button').text('+')
      .classed('newsprigbutton', true).classed('editcontrol', true);
    this.deleteButton = this.textpane.append('button').text('-')
      .classed('deletesprigbutton', true).classed('editcontrol', true);
    this.textpane.append('label').text('Emphasize')
      .classed('editcontrol', true);
    this.emphasizeCheckbox = this.textpane.append('input').attr({
      type: 'checkbox',
      id: 'emphasize'
    })
    .classed('editcontrol', true);
    
    this.newSprigotButton = this.textpane.append('button').text('New Sprigot!')
      .classed('editcontrol', true);

    this.textpane.append('label').text('Tags').classed('editcontrol', true);

    function eatEvent() {
      // d3.event will be a valid object at runtime.
      d3.event.stopPropagation();
    }

    this.tagField = this.textpane.append('input').attr({
      value: 'tagsgohere'
    })
    .classed('editcontrol', true)
    .on('keyup', eatEvent)
    .on('keydown', eatEvent);

    this.textpane.append('label').text('Formats').classed('editcontrol', true);
    this.formatField = this.textpane.append('input').attr({
      value: ''
    })
    .classed('editcontrol', true)
    .on('keyup', eatEvent)
    .on('keydown', eatEvent);
  }

  this.initFindUnreadLink();
  // Other controls can be init'ed here.

  d3.selectAll('#textpane .contentZone,.editcontrol').style('display', 'none');

  if (this.editAvailable) {
    this.textcontent.on('click', this.startEditing.bind(this));
    this.titleField.on('click', this.startEditing.bind(this));

    this.addButton.on('click', 
      this.sprigot.respondToAddChildSprigCmd.bind(this.sprigot));
    this.deleteButton.on('click', this.showDeleteSprigDialog.bind(this));

    this.emphasizeCheckbox.on('change', 
      this.respondToEmphasisCheckChange.bind(this));

    this.contentZoneStrokeRouter = createStrokeRouter(this.contentZone);
    this.contentZoneStrokeRouter.routeKeyDown('enter', ['meta'], 
      this.endEditing.bind(this));
    this.contentZoneStrokeRouter.absorbAllKeyUpEvents = true;

    this.newSprigotButton.on('click', 
      this.sprigot.respondToNewSprigotCmd.bind(this.sprigot));
  }
}

TextStuff.initFindUnreadLink = function initFindUnreadLink() {
  this.findUnreadLink = this.pane.append('a')
    .attr('id', 'findunreadlink')
    .classed('control-link', true)
    .classed('findunread-link', true)
    .text('Find Unread')
    .style('display', 'none')
    .on('click', this.sprigot.respondToFindUnreadCmd.bind(this.sprigot));
};

TextStuff.syncTextpaneWithTreeNode = function syncTextpaneWithTreeNode(treeNode) {
  this.textcontent.datum(treeNode);
  this.titleField.datum(treeNode);

  this.textcontent.html(treeNode.body);
  this.titleField.html(treeNode.title);

  if (this.editAvailable) {
    this.emphasizeCheckbox.node().checked = this.graph.focusNode.emphasize;
    this.tagField.node().value = treeNode.tags ? treeNode.tags.join(' ') : '';
    this.formatField.node().value =
      treeNode.formats ? treeNode.formats.join(' ') : '';
  }

  if (this.sprigot.isMobile()) {
    // this.divider.hideGraph();
    window.scrollTo(0, 0);
  }
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
  setTimeout(function doIt() {
    this.syncTextpaneWithTreeNode(treeNode);
    this.fadeInTextPane(750);
    this.fadeInControlLinks(800);
  }
  .bind(this),
  725);
}

TextStuff.uncollapseTextpane = function uncollapseTextpane() {
  var textPaneIsCollapsed = this.pane.classed('collapsedPane');
  if (textPaneIsCollapsed) {
    this.divider.toggleGraphExpansion();
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
  return 's' + uid(lengthOfRandomPart);
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

    // Temp. hack.
    var tagFieldValue = this.tagField.node().value;
    if (tagFieldValue.length > 0) {
      var tags = tagFieldValue.split(' ');
      editedNode.tags = tags;
    }
    else {
      editedNode.tags = [];
    }
    var formatFieldValue = this.formatField.node().value;
    if (formatFieldValue.length > 0) {
      var formats = formatFieldValue.split(' ');
      editedNode.formats = formats;
    }
    else {
      editedNode.formats = [];
    }

    this.textcontent.datum(editedNode);
    this.titleField.datum(editedNode);

    if (!skipSave) {
      this.store.saveSprigFromTreeNode(this.textcontent.datum(), 
        this.sprigot.opts.doc.id);
    }
  }
}

TextStuff.endEditing = function endEditing() {
  if (this.contentZone.classed('editing')) {
    this.changeEditMode(false);
  }
}

TextStuff.showDeleteSprigDialog = function showDeleteSprigDialog() {
  this.OKCancelDialog = new OKCancelDialog('#questionDialog', 
    'Do you want to delete this?', 'Delete', 
    this.sprigot.respondToDeleteSprigCmd.bind(this.sprigot),
    function removeOKCancelDialog() {
      delete this.OKCancelDialog;
    }
    .bind(this)
  );
  this.OKCancelDialog.show();  
}

/* Responders */

TextStuff.respondToEmphasisCheckChange = function respondToEmphasisCheckChange() {
  if (this.graph.focusNode) {
    this.graph.focusNode.emphasize = this.emphasizeCheckbox.node().checked;
    this.treeRenderer.update(this.graph.nodeRoot);
    this.store.saveSprigFromTreeNode(this.graph.focusNode, this.sprigot.opts.doc.id);
  }
}

TextStuff.startEditing = function startEditing() {
  d3.event.stopPropagation();
  if (!this.contentZone.classed('editing')) {
    this.changeEditMode(true);
  }
};

