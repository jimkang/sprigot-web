// Adds a script tag using the given TypeKit url. When the TypeKit script 
// arrives, it loads the TypeKit and calls the callback.
function loadATypeKit(typekitURL, done) {
  var head = d3.select('head');

  var needToRunDone = true;

  var typekitScript = head.append('script').attr({
    type: 'text/javascript',
    src: typekitURL
  });
  var typekitScriptEl = typekitScript.node();
  typekitScriptEl.async = true;
  typekitScriptEl.onload = function loadTypeKit() {
    try {
      console.log('Typekit is loading.');
      function typekitDone() {
        if (needToRunDone) {
          console.log('needToRunDone is true.');
          needToRunDone = false;
          clearTimeout(timerId)
          done();
        }
      }

      Typekit.load({
        active: typekitDone,
        inactive: typekitDone
      });
    } 
    catch (e) {
      debugger;
    }
  };

  var timerId = setTimeout(function timeIsUp() {
    if (needToRunDone) {
      console.log('Moving on.')
      needToRunDone = false;
      done();
    }
    else {
      console.log('Typekit already loaded.')
    }
  },
  1000);
}

