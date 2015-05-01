function createPaneShiftControl(opts) {
  var parent;
  var arrow;
  var clickResponder;
  var expandDirection = 1;

  if (opts) {
    parent = opts.parent;
    clickResponder = opts.onClick;
    expandDirection = opts.expandDirection;
  }

  function render() {
    var board = parent.append('svg').classed('arrowboard', true);
    arrow = board.append('polygon').attr({
      id: 'expanderArrow',
      fill: 'rgba(0, 0, 64, 0.4)',
      stroke: '#E0EBFF',
      'stroke-width': 1,
      points: '0,0 16,12 0,24',
      transform: transformForDirection(expandDirection)
    });

    if (clickResponder) {
      arrow.on('click', clickResponder);
    }
  }

  function transformForDirection(direction) {
    var transform = 'translate(3, 0) scale(1, 1)';

    if (direction < 1) {
      transform = 'translate(18, 0) scale(-1, 1)';
    }

    return transform;
  }

  return {
    render: render
  };
}

module.exports = createPaneShiftControl;
