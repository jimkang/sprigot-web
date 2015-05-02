function createPaneShiftControl(opts) {
  var parent;
  var arrow;
  var clickResponder;
  var expandDirection = 1;
  var onDarkBackground;

  if (opts) {
    parent = opts.parent;
    clickResponder = opts.onClick;
    expandDirection = opts.expandDirection;
    onDarkBackground = opts.onDarkBackground;
  }

  function render() {
    var board = parent.append('svg').classed({
      'arrowboard': true,
      'against-left': (expandDirection < 0),
      'against-right': (expandDirection > 0)
    });

    arrow = board.append('polygon')
      .attr({
        id: 'expanderArrow',
        points: '0,0 16,12 0,24',
        transform: transformForDirection(expandDirection)
      })
      .classed({
        'arrow': true,
        'on-dark': onDarkBackground
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
