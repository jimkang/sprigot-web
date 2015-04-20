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
  var respondToMoveChildLeftCmd;
  var respondToMoveChildRightCmd;

  if (opts) {
    root = opts.root;

    if (opts.responders) {
      respondToEmphasisCheckChange = opts.responders.respondToEmphasisCheckChange;
      respondToAddChildSprigCmd = opts.responders.respondToAddChildSprigCmd;
      respondToNewSprigotCmd = opts.responders.respondToNewSprigotCmd;
      respondToDeleteSprigCmd = opts.responders.respondToDeleteSprigCmd;
      respondToMoveChildLeftCmd = opts.responders.respondToMoveChildLeftCmd;
      respondToMoveChildRightCmd = opts.responders.respondToMoveChildRightCmd;
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
    },
    {
      id: 'move-left-button',
      elementType: 'button',
      text: 'Move left',
      onClick: respondToMoveChildLeftCmd
    },
    {
      id: 'move-right-button',
      elementType: 'button',
      text: 'Move right',
      onClick: respondToMoveChildRightCmd
    },
    {
      id: 'newsprigotbutton',
      elementType: 'button',
      text: 'New Document',
      onClick: respondToNewSprigotCmd
    },
    {
      id: 'tags-label',
      elementType: 'label',
      text: 'Tags'
    },
    {
      id: 'tags-field',
      elementType: 'input',
      attributes: {
        value: 'tags go here'
      },
      onKeyUp: eatEvent,
      onKeyDown: eatEvent
    },
    {
      id: 'format-label',
      elementType: 'label',
      text: 'Formats'
    },
    {
      id: 'formats-field',
      elementType: 'input',
      attributes: {
        value: ''
      },
      onKeyUp: eatEvent,
      onKeyDown: eatEvent
    }
  ]);

  var emphasizeCheckbox = addEmphasizeCheckbox();

  document.addEventListener('node-focus-change', respondToFocusChange);

  function addEmphasizeCheckbox() {
    var emphasisContainer = listRoot.append('li');
    emphasisContainer.append('label')
      .text('Emphasize')
      .classed('editcontrol', true);

    emphasizeCheckbox = emphasisContainer.append('input')
      .attr({
        type: 'checkbox',
        id: 'emphasize'
      })
      .classed('editcontrol', true);

    emphasizeCheckbox.on('change', respondToEmphasisCheckChange);

    return emphasizeCheckbox;
  }

  function respondToFocusChange(e) {
    var focusNode = e.detail.focusNode;

    emphasizeCheckbox.node().checked = focusNode.emphasize;
    d3.select('#tags-field').node().value =
      focusNode.tags ? focusNode.tags.join(' ') : '';
    d3.select('#formats-field').node().value =
      focusNode.formats ? focusNode.formats.join(' ') : '';

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
