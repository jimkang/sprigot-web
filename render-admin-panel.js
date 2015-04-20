var d3 = require('./lib/d3-small');
var OKCancelDialog = require('./okcanceldialog');
var createControlRenderer = require('./control-renderer');

function renderAdminPanel(opts) {
  var root;
  var controlRenderer;

  var respondToEmphasisCheckChange;
  var respondToAddChildSprigCmd;
  var respondToNewSprigotCmd;
  var respondToDeleteSprigCmd;

  if (opts) {
    root = opts.root;

    if (opts.responders) {
      respondToEmphasisCheckChange = opts.responders.respondToEmphasisCheckChange;
      respondToAddChildSprigCmd = opts.responders.respondToAddChildSprigCmd;
      respondToNewSprigotCmd = opts.responders.respondToNewSprigotCmd;
      respondToDeleteSprigCmd = opts.responders.respondToDeleteSprigCmd;      
    }
  }

  if (!root) {
    throw new Error('No root passed to renderAdminPanel.');
  }


  var listRoot = root.select('#admin-control-root');
  if (listRoot.empty()) {
    listRoot = root.append('ul').attr('id', 'admin-control-root');
  }

  var controlRenderer = createControlRenderer({
    root: listRoot,
    baseElementType: 'li',
    baseClass: 'admin-control'
  });

  controlRenderer.render([
    {
      id: 'newsprigbutton',
      elementType: 'button',
      text: '+',
      onClick: respondToAddChildSprigCmd
    },
    {
      id: 'deletesprigbutton',
      elementType: 'button',
      text: '-',
      onClick: respondToDeleteSprigCmd
    }
  ]);

  var emphasizeCheckbox;

  addElements();
  addEventHandlers();

  function addElements() {
    root.append('label')
      .text('Emphasize')
      .classed('editcontrol', true);

    emphasizeCheckbox = root.append('input')
      .attr({
        type: 'checkbox',
        id: 'emphasize'
      })
      .classed('editcontrol', true);
    
    // newSprigotButton = root.append('button')
    //   .text('New Sprigot!')
    //   .classed('editcontrol', true);

    root.append('label')
      .text('Tags')
      .classed('editcontrol', true);

    tagField = root.append('input')
      .attr({
        value: 'tagsgohere'
      })
      .classed('editcontrol', true)
      .on('keyup', eatEvent)
      .on('keydown', eatEvent);

    root.append('label')
      .text('Formats')
      .classed('editcontrol', true);

    formatField = root.append('input')
      .attr({
        value: ''
      })
      .classed('editcontrol', true)
      .on('keyup', eatEvent)
      .on('keydown', eatEvent);
  }

  function addEventHandlers() {
    emphasizeCheckbox.on('change', respondToEmphasisCheckChange);
    // newSprigotButton.on('click', respondToNewSprigotCmd);

    document.addEventListener('node-focus-change', respondToFocusChange);
  }

  function respondToFocusChange(e) {
    var focusNode = e.detail.focusNode;
    emphasizeCheckbox.node().checked = focusNode.emphasize;
    tagField.node().value = focusNode.tags ? focusNode.tags.join(' ') : '';
    formatField.node().value = focusNode.formats ? focusNode.formats.join(' ') : '';
  }
}

function eatEvent() {
  // d3.event will be a valid object at runtime.
  d3.event.stopPropagation();
}

function showDeleteSprigDialog() {
  (new OKCancelDialog(
    '#questionDialog',
    'Do you want to delete this?',
    'Delete',
    respondToDeleteSprigCmd
  ))
  .show();
}

module.exports = renderAdminPanel;
