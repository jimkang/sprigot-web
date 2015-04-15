function createCollisionFinder(svgEl) {

var collisionFinder = {
  svgEl: svgEl,
  hitRectSVG: svgEl.createSVGRect(),
  hitPointSVG: svgEl.createSVGPoint()
};

collisionFinder.hitRectSVG.width = 100;
collisionFinder.hitRectSVG.height = 100;

collisionFinder.elementsAtPoint = function elementsAtPoint(pointRelativeToSVG) {
  this.hitRectSVG.x = pointRelativeToSVG[0];
  this.hitRectSVG.y = pointRelativeToSVG[1];
  return this.svgEl.getIntersectionList(this.hitRectSVG, null);
};

collisionFinder.elementsHittingEl = function elementsHittingEl(el) {
  var transformMatrix = el.getCTM();
  var bounds = el.getBBox();
  var bottomRight = this.svgEl.createSVGPoint();

  this.hitPointSVG.x = bounds.x;
  this.hitPointSVG.y = bounds.y;
  bottomRight.x = bounds.x + bounds.width;
  bottomRight.y = bounds.y + bounds.height;

  var transformedPoint = this.hitPointSVG.matrixTransform(transformMatrix);
  bounds.x = transformedPoint.x;
  bounds.y = transformedPoint.y;

  var transformedBottomRight = bottomRight.matrixTransform(transformMatrix);
  bounds.width = transformedBottomRight.x - transformedPoint.x;
  bounds.height = transformedBottomRight.y - transformedPoint.y;

  return this.svgEl.getIntersectionList(bounds, null);
};

return collisionFinder;
}
