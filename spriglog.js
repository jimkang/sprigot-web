var createSprigotBaseMixin = require('./sprigotbasemixin');
var loadATypeKit = require('./load_a_typekit');
var Historian = require('./historian');
var getStoreForDoc = require('./get-store');
var D3SprigBridge = require('./d3sprigbridge');
var accessor = require('accessor');

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

    getStoreForDoc(docId).getSprigTree(docId, opts.format, renderTree);
  }

  function renderTree(error, sprigTree) {
    if (error) {
      opts.loadDone(error, null);
    }
    else if (sprigTree) {
      d3.select('title').text('Sprigot - ' + sprigTree.title);

      var root = d3.select('.bloge').append('ul').classed('sprig', true);
      renderTreeToRoot
        .bind(root.node())(D3SprigBridge.sanitizeTreeForD3(sprigTree));

      Historian.syncURLToSprigId(opts.doc.rootSprig);
      opts.loadDone();
    }
    else {
      opts.loadDone(new Error('Sprig tree not found.'));
    }
  }

  function renderTreeToRoot(tree) {
    // D3 will set `this` up as the root element.
    var root = d3.select(this);
    root.attr('id', tree.id);

    // .attr('class', 
    //   function getCSSClasses(d) {
    //     var cssClasses = ['sprig', 'textpane'];
    //     if (d.tags) {
    //       cssClasses = cssClasses.concat(d.tags);
    //     }
    //     return cssClasses.join(' ');
    //   }
    // );
    var collapsed = (tree.tags && tree.tags.indexOf('click-to-display') !== -1);

    var titleItem = root.append('li')
      .classed('title', true)
      .text(tree.title);

    root.append('li')
      .classed({
        sprigbody: true,
        hidden: collapsed
      })
      .html(tree.body);

    if (collapsed) {
      root.classed('click-to-display', true);
      titleItem.on('click', displayBodyAndImmediateChildren);
    }

    // if (opts.doc.showStamps) {
    //   root.append('div').classed('stamps', true);
    // }
    
    // newSprigs.filter('.click-to-display').on('click', displayBody);

    // if (!opts.doc.showStamps) {
    //   sprigs.select('.stamps').text(function getStamps(d) {
    //     var createdDate = new Date(d.created);
    //     stamp = createdDate.toLocaleString();
    //     return stamp;
    //   });
    // }

    // sprigs.select('.sprigbody').html(bodyGet);
    
    // var sprigsToRemove = sprigs.exit();
    // sprigsToRemove.remove();
    if (tree.children) {
      var childSprigs = root.selectAll('ul.sprig')
        .data(tree.children, accessor());

      var childItems = childSprigs.enter().append('li')
        .classed('hidden', collapsed);

      var childLists = childItems.append('ul').classed('sprig', true);
      childLists.each(renderTreeToRoot);
    }
  }

  function displayBodyAndImmediateChildren(sprig) {
    // Don't let the click bubble up to parent elements.
    d3.event.stopPropagation();

    var body = d3.select(this.parentNode).select('.sprigbody');

    d3.selectAll('#' + sprig.id + ' > :not(.title)')
      .classed('displaying-hidden', !body.classed('displaying-hidden'));
  }

  return {
    init: init,
    load: load
  };
}

module.exports = createSpriglog;
