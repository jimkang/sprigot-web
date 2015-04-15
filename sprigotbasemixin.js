function createSprigotBaseMixin() {

var baseMixin = {
};

baseMixin.setUpOuterContainer = function setUpOuterContainer(cssFilename, 
  containerClass, sprigotOpts) {

  var addedContainer = false;
  var sprigotSel = d3.select('.outer-container');

  if (sprigotOpts.forceRebuild || !sprigotSel.empty()) {
    if (sprigotOpts.forceRebuild || !sprigotSel.classed(containerClass)) {
      sprigotSel.remove();
      sprigotSel = d3.select('.outer-container');      
    }
  }

  var head = d3.select('head');
  var cssLink = head.select('link[rel=stylesheet]');
  if (cssLink.empty()) {
    cssLink = head.append('link');
    cssLink.attr({
      rel: 'stylesheet',
      type: 'text/css',
      href: cssFilename
    });
  }

  if (cssLink.attr('href') !== cssFilename) {
    cssLink.attr('href', cssFilename);
  }

  if (sprigotSel.empty()) {
    sprigotSel = d3.select('body').append('section')
      .classed('outer-container', true).classed(containerClass, true);

    addedContainer = true;
  }

  return addedContainer;
};

return baseMixin;
}
