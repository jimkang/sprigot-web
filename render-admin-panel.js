var d3 = require('./lib/d3-small');
var OKCancelDialog = require('./okcanceldialog');

function renderAdminPanel(opts) {
  var root;

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

  var addButton;
  var deleteButton;
  var emphasizeCheckbox;

  addElements();
  addEventHandlers();

  function addElements() {
    addButton = root.append('button')
      .text('+')
      .classed({
        newsprigbutton: true,
        editcontrol: true
      });

    deleteButton = root.append('button')
      .text('-')
      .classed('deletesprigbutton', true).classed('editcontrol', true);

    root.append('label')
      .text('Emphasize')
      .classed('editcontrol', true);

    emphasizeCheckbox = root.append('input')
      .attr({
        type: 'checkbox',
        id: 'emphasize'
      })
      .classed('editcontrol', true);
    
    newSprigotButton = root.append('button')
      .text('New Sprigot!')
      .classed('editcontrol', true);

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
    addButton.on('click', respondToAddChildSprigCmd);
    deleteButton.on('click', showDeleteSprigDialog);
    emphasizeCheckbox.on('change', respondToEmphasisCheckChange);
    newSprigotButton.on('click', respondToNewSprigotCmd);

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
