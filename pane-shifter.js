var d3 = require('./lib/d3-small');

function createPaneShifter(opts) {
  var instance = {
    toggle: toggle,
    setState: setState
  };
    var pane;
  var currentState = 'half-expanded';

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
  }

  pane.datum(instance);

  function toggle() {
    var nextState = getNextState(currentState);
    setState(nextState);
    updateOtherShiftersToState(stateComplements[currentState]);

    // document.dispatchEvent(new CustomEvent('pane-shift', {
    //   detail: {
    //     target: pane,
    //     targetPaneState: currentState,
    //     otherPanesStates: stateComplements[state]
    //   }
    // }));
  }

  function getNextState(state) {
    var next = state;

    if (state === 'collapsed') {
      next = 'half-expanded';
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
