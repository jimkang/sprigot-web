var TreeRenderer = {
  treeLayout: null,
  diagonalProjection: null,
  sprigTree: null,
  graphSVGGroup: null,
  graph: null,
  treeNodeAnimationDuration: 750,
  maxLabelWidth: 140
};

TreeRenderer.init = function init(sprigTree, graph) {
  // The tree layout generates a left-to-right tree by default, and we want a 
  // top-to-bottom tree, so we flip x and y when we talk to it.
  this.treeLayout = d3.layout.tree();
  this.treeLayout.nodeSize([160, 160]);
  this.sprigTree = sprigTree;
  this.diagonalProjection = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });
  this.graph = graph;
  this.graphSVGGroup = graph.svgRoot;
}

TreeRenderer.update = function update(source, duration) {
  if (!duration) {
    duration = this.treeNodeAnimationDuration;
  }

  // Compute the new tree layout.
  var nodes = this.treeLayout.nodes(this.sprigTree).reverse();
  nodes.forEach(function swapXAndY(d) {
    var oldX = d.x;
    var oldX0 = d.x0;
    d.x = d.y;
    d.x0 = d.y0;
    d.y = oldX;
    d.y0 = oldX0;
  });

  var links = this.treeLayout.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.x = d.depth * 180; });

  // Update the nodes.
  var node = this.graphSVGGroup.selectAll('g.node')
    .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append('g')
    .attr('class', 'node')
    .attr('transform', function() { 
      return 'translate(' + source.y0 + ',' + source.x0 + ')'; 
    })
    .attr('id', function(d) { return d.id; })
    .on('click', TreeRenderer.respondToNodeClick)
    .on('dblclick', this.onNodeDoubleClick.bind(this));

  if (this.graph.documentIsEditable()) {
    this.addDragToNodeSelection(nodeEnter);
  }

  nodeEnter.append('circle')
    .attr('r', 1e-6)
    .style('fill', function(d) { 
      return d._children ? 'lightsteelblue' : '#fff'; 
    })
    .style('fill-opacity', 0.7)
    .style('stroke', 'rgba(0, 64, 192, 0.7)');

  nodeEnter.append('text')
    .attr('x', function(d) { 
      return d.children || d._children ? '0.3em' : '-0.3em'; 
    })
    .attr('y', '-1em')
    .attr('dy', '.35em')
    .attr('text-anchor', 'middle')
    .text(function(d) { return d.title; })
    .style('fill-opacity', 1e-6);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
    .duration(duration)
    .attr('transform', function(d) { return 'translate(' + d.y + ',' + d.x + ')'; });

  nodeUpdate.select('circle')
    .attr('r', 8)
    .style('fill', function(d) {
      var fillColor = 'lightsteelblue';
      if (this.graph.nodeHasFocus(d)) {
        fillColor = '#e0362f';
      }
      else if (typeof d.emphasize === 'boolean' && d.emphasize) {
        fillColor = '#08a';        
      }
      return fillColor;
      // return d._children ? 'lightsteelblue' : '#fff'; 
    }
    .bind(this))
    .style('fill-opacity', function(d) {
      var opacity = 0.7;
      if (this.graph.nodeHasFocus(d)) {
        opacity = 1.0;
      }
      return opacity;
    }
    .bind(this))
    .style('stroke-width', function(d) {
      // If you use em to specify the size, Firefox will animate all weirdly.
      return (d._children && d._children.length > 0) ? '32px' : 0;
    });

  nodeUpdate.select('text')
    .style('fill-opacity', function (d) { 
      return this.graph.nodeHasFocus(d) ? 1.0 : 0.85; 
    }
    .bind(this))
    .call(wrap, function getTitle(d) { return d.title; }, this.maxLabelWidth);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
    .duration(duration)
    .attr('transform', function() { 
      return 'translate(' + source.y + ',' + source.x + ')'; 
    })
    .remove();

  nodeExit.select('circle')
    .attr('r', 1e-6);

  nodeExit.select('text')
    .style('fill-opacity', 1e-6);

  // Update the links…
  var link = this.graphSVGGroup.selectAll('path.link')
    .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert('path', 'g')
    .attr('class', 'link')
    .attr('d', function() {
      var o = {x: source.x0, y: source.y0};
      return this.diagonalProjection({source: o, target: o});
    }
    .bind(this));

  // Transition links to their new position.
  link//.transition()
    // .duration(duration)
    .attr('d', this.diagonalProjection)
    .attr('stroke-width', function getLinkWidth(d) {
      if (this.graph.nodeWasVisited(d.target)) {
        return 3;
      }
      else {
        return 1.5;
      }
    }
    .bind(this));

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
    .duration(duration)
    .attr('d', function getLinkData() {
      var o = {x: source.x, y: source.y};
      return this.diagonalProjection({source: o, target: o});
    }
    .bind(this))
    .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

TreeRenderer.respondToNodeClick = function respondToNodeClick(treeNode) {
  // Global!
  TreeRenderer.graph.treeNav.chooseTreeNode(treeNode, this);
}

TreeRenderer.onNodeDoubleClick = function onNodeDoubleClick(treeNode) {
  this.graph.treeNav.toggleChildren(treeNode);
  this.update(treeNode);
};

TreeRenderer.addDragToNodeSelection = function addDragToNodeSelection(sel) {
  var dragger = d3.behavior.drag();

  dragger.on('dragstart', function stopOtherDraggers(d) {
    d3.event.sourceEvent.stopPropagation();
    d.x0 = d.x;
    d.y0 = d.y;
  });

  dragger.on('drag', function adjustPosition(d) {
    d3.event.sourceEvent.stopPropagation();
    this.setAttribute('transform', translateTransform(d3.event.x, d3.event.y));
    // Reminder:
    // The tree layout generates a left-to-right tree by default, and we want a 
    // top-to-bottom tree, so we flip x and y when we talk to it.
    d.x = d3.event.y;
    d.y = d3.event.x;
  });

  dragger.on('dragend', function reportDrag(d) {
    d3.event.sourceEvent.stopPropagation();
    TreeRenderer.graph.nodeWasDragged(d, this);
  });

  sel.call(dragger);
};

function translateTransform(x, y) {
  return 'translate(' + x + ', ' + y + ')';
}

// Based on https://gist.github.com/mbostock/7555321.
function wrap(text, getTextData, width) {
  text.each(function(d) {
    // console.log('text.text()', text.text());
    var text = d3.select(this),
      words = getTextData(d).split(/\s+/).reverse(),
      word,
      line = [],
      lineHeight = 1.1, // ems
      y = text.attr('y'),
      dy = parseFloat(text.attr('dy')),
      tspan = text.text(null).append('tspan')
        .attr('x', 0).attr('y', y).attr('dy', dy + 'em');

    var tspans = [tspan];

    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(' '));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = text.append('tspan')
          .attr('x', 0).attr('y', y)
          .text(word);
        tspans.push(tspan);
      }
    }

    for (var i = 0; i < tspans.length; ++i) {
      var tspanToPlace = tspans[i];
      tspanToPlace.attr('dy', dy - (tspans.length - i - 1) * lineHeight + 'em');
    }
  });
}
