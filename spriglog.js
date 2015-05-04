var createSprigotBaseMixin = require('./sprigotbasemixin');
var loadATypeKit = require('./load_a_typekit');
var Historian = require('./historian');
var getStoreForDoc = require('./get-store');

function createSpriglog(opts) {
  // Expected in opts: doc, loadDone.
  opts = opts ? opts : {};
  var spriglogSel = null;
  var controllerType = 'bloge';
  var sprigList = [];

  function init(initDone) {
    var baseMixin = createSprigotBaseMixin();
    var addedContainer = baseMixin.setUpOuterContainer(
      opts.doc.style ? opts.doc.style + '.css' : 'bloge.css', 'bloge', opts
    );

    if (addedContainer) {
      spriglogSel = d3.select('.bloge');
    }
    else {
      setTimeout(initDone, 0);
      return;
    }

    loadATypeKit('//use.typekit.net/med0yzx.js', initDone);
  }

  function load() {
    var docId = opts.doc.id;

    Historian.init(null, docId);

    getStoreForDoc(docId).getSprigList(docId, opts.format, renderList);
  }

  function renderList(error, sprigList) {
    if (error) {
      opts.loadDone(error, null);
    }
    else if (sprigList) {
      if (sprigList.length > 0) {
        d3.select('title').text('Sprigot - ' + sprigList[0].title);
      }

      render(sprigList);

      Historian.syncURLToSprigId(opts.doc.rootSprig);
      opts.loadDone();
    }
    else {
      opts.loadDone(new Error('Sprig tree not found.'));
    }
  }
  
  function render(sprigList) {
    var sprigs = spriglogSel.selectAll('.sprig')
      .data(sprigList, function(d) { return d.id; });

    var newSprigs = sprigs.enter().append('div').attr('class', 
      function getCSSClasses(d) {
        var cssClasses = ['sprig', 'textpane'];
        if (d.tags) {
          cssClasses = cssClasses.concat(d.tags);
        }
        return cssClasses.join(' ');
      }
    );

    newSprigs.append('div').classed('title', true);
    newSprigs.append('div').classed('sprigbody', true);
    if (opts.doc.showStamps) {
      newSprigs.append('div').classed('stamps', true);
    }
    newSprigs.filter('.click-to-display').on('click', function displayBody() {
      var sprig = d3.select(this);
      sprig.classed('displaying-hidden', !sprig.classed('displaying-hidden'));
    });

    sprigs.select('.title').text(function getTitle(d) {return d.title;});

    if (!opts.doc.showStamps) {
      sprigs.select('.stamps').text(function getStamps(d) {
        var createdDate = new Date(d.created);
        stamp = createdDate.toLocaleString();
        return stamp;
      });
    }

    sprigs.select('.sprigbody').html(function getBody(d) {return d.body;});
    
    var sprigsToRemove = sprigs.exit();
    sprigsToRemove.remove();
  }


  return {
    init: init,
    load: load
  };
}

module.exports = createSpriglog;
