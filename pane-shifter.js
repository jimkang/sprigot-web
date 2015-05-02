var d3 = require('./lib/d3-small');
var isMobile = require('./is-mobile');

function createPaneShifter(opts) {
  var instance = {
    toggle: toggle,
    setState: setState,
    syncToState: syncToState
  };
  
  var pane;
  var currentState = 'half-expanded';
  var expandDirection = 1;

  var stateComplements = {
    'fully-expanded': 'collapsed',
    'half-expanded': 'half-expanded',
    'collapsed': 'fully-expanded'
  };

  var states = [
    'fully-expanded',
    'half-expanded',
    'collapsed'
  ];

  if (opts) {
    pane = opts.pane;
    currentState = opts.state;
    expandDirection = opts.expandDirection;
  }

  pane.datum(instance);
  var parent = d3.select(pane.node().parentNode);

  syncToState(currentState);

  function toggle() {
    syncToState(getNextState(currentState));
  }

  function syncToState(nextState) {
    setState(nextState);
    updateOtherShiftersToState(stateComplements[currentState]);

    var extraWidthNeeded = (currentState !== 'half-expanded');

    parent.classed({
      'extra-wide': extraWidthNeeded,
      'shift-left': (extraWidthNeeded && expandDirection < 0),
      'shift-right': (extraWidthNeeded && expandDirection > 0)
    });
  }

  function getNextState(state) {
    var next = state;
    var mobile = isMobile();

    if (state === 'collapsed') {
      next = mobile ? 'fully-expanded' : 'half-expanded';
    }
    else if (currentState == 'half-expanded') {
      next = 'fully-expanded';
    }

    return next;
  }

  function setState(state) {
    currentState = state;

    states.forEach(toggleStateClass);

    function toggleStateClass(possibleState) {
      pane.classed(possibleState, possibleState === currentState);
    }
  }

  function updateOtherShiftersToState(state) {
    // Careful about recursion here.
    d3.selectAll('.pane').each(updateOtherShifter);

    function updateOtherShifter(shifter) {
      if (shifter && shifter !== instance) {
        shifter.setState(state);
      }
    }
  }

  return instance;
}

module.exports = createPaneShifter;
