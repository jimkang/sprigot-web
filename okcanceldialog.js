function OKCancelDialog(parentSelector, text, okText, 
  respondToOK, cleanUpFunction) {

  this.parentSelector = parentSelector;
  this.text = text;
  this.okText = okText;
  this.respondToOK = respondToOK;
  this.cleanUpFunction = cleanUpFunction;
}

OKCancelDialog.prototype.show = function show() {
  var dialogDiv = d3.select(this.parentSelector).append('div')
    .attr('id', 'OKCancelDialog').classed('notification', true);
  dialogDiv.append('p').attr('id', 'dialogText').text(this.text);
  dialogDiv.append('button').attr('id', 'OKButton')
    .text(this.okText ? this.okText : 'OK')
    .on('click', this.respondToOKClick.bind(this));
  dialogDiv.append('button').attr('id', 'CancelButton')
    .text('Cancel')
    .on('click', this.respondToCancelClick.bind(this));
};

OKCancelDialog.prototype.respondToOKClick = function respondToOKClick() {
  this.respondToOK();
  if (this.cleanUpFunction) {
    this.cleanUpFunction();
  }
  d3.select(this.parentSelector).select('#OKCancelDialog').remove();
};

OKCancelDialog.prototype.respondToCancelClick = 
function respondToCancelClick() {
  if (this.cleanUpFunction) {
    this.cleanUpFunction();
  }
  d3.select(this.parentSelector).select('#OKCancelDialog').remove();
};

