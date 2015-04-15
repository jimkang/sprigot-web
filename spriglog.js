function createSpriglog(opts) {
// Expected in opts: doc, loadDone.

var Spriglog = {
  store: null,
  opts: opts,
  spriglogSel: null,
  controllerType: 'bloge',
  sprigList: [],
  sprigShowRange: [0, 5], // Excludes end
  numberOfSprigsToRevealPerScrollEnd: 5
};

Spriglog.init = function init(initDone) {
  this.opts = opts ? opts : {};

  var baseMixin = createSprigotBaseMixin();
  var addedContainer = baseMixin.setUpOuterContainer(
    this.opts.doc.style ? this.opts.doc.style + '.css' : 'bloge.css', 
    'bloge', this.opts);

  if (addedContainer) {
    this.spriglogSel = d3.select('.bloge');
  }
  else {
    setTimeout(initDone, 0);
    return;
  }

  this.store = createStore();
  loadATypeKit('//use.typekit.net/med0yzx.js', initDone);
};

Spriglog.load = function load() {
  Historian.init(null, this.opts.doc.id);

  this.store.getSprigList(this.opts.doc.id, this.opts.format,
    function doneGettingList(error, sprigList) {
      if (error) {
        this.opts.loadDone(error, null);
      }
      else if (sprigList) {
        this.sprigList = sprigList;

        if (sprigList.length > 0) {
          d3.select('title').text('Sprigot - ' + this.sprigList[0].title);          
        }

        if (this.sprigList.length < this.sprigShowRange[1]) {
          this.sprigShowRange[1] = this.sprigList.length;
        }

        this.render(
          sprigList.slice(this.sprigShowRange[0], this.sprigShowRange[1]));

        window.onscroll = this.respondToScroll.bind(this);
        Historian.syncURLToSprigId(this.opts.doc.rootSprig);
        this.opts.loadDone();
      }
      else {
        this.opts.loadDone('Sprig tree not found.');
      }
    }
    .bind(this)
  );
};

Spriglog.render = function render(sprigList) {
  var sprigs = this.spriglogSel.selectAll('.sprig')
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
  if (this.opts.doc.showStamps) {
    newSprigs.append('div').classed('stamps', true);
  }
  newSprigs.filter('.click-to-display').on('click', function displayBody() {
    var sprig = d3.select(this);
    sprig.classed('displaying-hidden', !sprig.classed('displaying-hidden'));
  });

  sprigs.select('.title').text(function getTitle(d) {return d.title;});

  if (!this.opts.doc.showStamps) {
    sprigs.select('.stamps').text(function getStamps(d) {
      var createdDate = new Date(d.created);
      stamp = createdDate.toLocaleString();
      return stamp;
    });
  }

  sprigs.select('.sprigbody').html(function getBody(d) {return d.body;});
  
  var sprigsToRemove = sprigs.exit();
  sprigsToRemove.remove();
};

Spriglog.respondToScroll = function respondToScroll() {
  // Scrolled to bottom of body?
  if (document.body.scrollHeight - document.body.scrollTop === 
    document.body.clientHeight) {

    // Is there is more to show?
    if (this.sprigShowRange[0] + this.sprigShowRange[1] < 
      this.sprigList.length) {

      this.sprigShowRange[1] += this.numberOfSprigsToRevealPerScrollEnd;
      if (this.sprigShowRange[0] + this.sprigShowRange[1] >= 
        this.sprigList.length) {

        this.sprigShowRange[1] = this.sprigList.length - this.sprigShowRange[0];
      }

      this.render(this.sprigList.slice(this.sprigShowRange[0], 
        this.sprigShowRange[1]));
    }
  }
};

return Spriglog;
}
