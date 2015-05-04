var d3 = require('./lib/d3-small');
var accessor = require('accessor');
var exportMethods = require('export-methods');
var _ = require('lodash');

function createControlRenderer(opts) {
  var root;
  var baseElementType;
  var baseClass;

  if (opts) {
    root = opts.root;
    baseElementType = opts.baseElementType;
    baseClass = opts.baseClass;
  }

  if (!root) {
    throw new Error('No root passed to renderAdminPanel.');
  }
  if (!baseElementType) {
    baseElementType = 'div';
  }
  if (!baseClass) {
    baseClass = 'generic-control';
  }

  var getText = accessor('text');
  var getId = accessor();

  // Warning: Doesn't use namespaces right now.
  function createElement(controlDef) {
    return document.createElement(controlDef.elementType);
  }

  function render(controlDefs) {
    var controlHousings = root.selectAll(baseElementType)
      .data(controlDefs, accessor());

    controlHousings.enter()
      .append(baseElementType)
      .append(createElement)
      .classed(baseClass, true)
      .attr('id', getId)
      .on('click', respondToClick)
      .on('blur', respondToFocusLoss);

    controlHousings.exit()
      .classed('fade-out', true)
      .transition().delay(300)
      .remove();
    
    var controls = controlHousings.selectAll(baseElementType + ' > *');
    controls.each(updateAttributes);
    controls.text(getText);
  }

  function updateAttributes(controlDef) {
    if (controlDef.attributes) {
      var control = d3.select(this);

      for (var key in controlDef.attributes) {
        control.attr(key, controlDef.attributes[key]);
      }
    }
  }

  function respondToClick(controlDef) {
    if (controlDef.onClick) {
      controlDef.onClick();
    }
  }

  function respondToFocusLoss(controlDef) {
    if (controlDef.onFocusLoss) {
      controlDef.onFocusLoss();
    }
  }

  return exportMethods(render);
}

module.exports = createControlRenderer;
