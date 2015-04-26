var createSprigotBaseMixin = require('./sprigotbasemixin');
var loadATypeKit = require('./load_a_typekit');
var createStore = require('./store');
var idmaker = require('idmaker');
var d3 = require('./lib/d3-small');
var accessor = require('accessor');

function createNewDocForm(opts) {
  var newDocFormSel;

  function init(initDone) {
    opts = opts ? opts : {};

    var baseMixin = createSprigotBaseMixin();
    var addedContainer = baseMixin.setUpOuterContainer(
      'form.css', 'form', opts
    );
    if (!addedContainer) {
      initDone();
      return;
    }
    else {
      newDocFormSel = d3.select('.form');

    // this.store = createStore();

      loadATypeKit('//use.typekit.net/med0yzx.js', initDone);    
    }
  }

  function load() {
    render([{
      title: 'New Sprigot document',
      fields: [
        {
          id: 'name',
          name: 'Name',
          type: 'text'
        },
        {
          id: 'author',
          name: 'Author',
          type: 'text'
        },
        {
          id: 'admin',
          name: 'Admin',
          type: 'text'
        },
        {
          id: 'format',
          name: 'Format',
          type: 'select',
          options: [
            'sprigot',
            'bloge'
          ]
        }
      ],
      submit: {
        action: function submitNewDocument(formValues) {
          var store = createStore();
          var newDoc = {
            id: formValues.name,
            rootSprig: idmaker.randomId(8),
            authors: [
              formValues.author
            ],
            admins: [
              formValues.author
            ],
            format: formValues.format
          };

          var currentJSONDate = (new Date()).toJSON();

          var rootSprig = {
            id: newDoc.rootSprig,
            doc: newDoc.id,
            title: formValues.name,
            body: 'Hello. Type some stuff here.',
            children: [],
            created: currentJSONDate,
            modified: currentJSONDate 
          };

          store.createNewDoc(newDoc, rootSprig, function done(error, response) {
            if (error) {
              console.log('Error while saving doc:', error);
            }
            else {
              console.log('Saved doc:', response);
              Director.direct('#/' + newDoc.id + '/' + rootSprig.id + 
                '?forceRebuild=true');
            }
          });
        },
        name: 'Make it!'
      }
    }]);

    setTimeout(function doneOnNextTick() { opts.loadDone(); }, 0);
  };

  function render(forms) {
    var sprigs = newDocFormSel.selectAll('.sprig')
      .data(forms, accessor());

    var newSprigs = sprigs.enter().append('div')
      .classed('sprig', true)
      .classed('textpane', true);

    newSprigs.append('div').classed('title', true);
    var sprigBody = newSprigs.append('div').classed('sprigbody', true);

    sprigs.select('.title').text(function getTitle(d) {return d.title;});
    // sprigs.select('.sprigbody').html(function getBody(d) {return d.body;});
    
    var sprigsToRemove = sprigs.exit();
    sprigsToRemove.remove();

    sprigBody.each(setUpFields);

    sprigBody.append('button').classed('submit-button', true)
      .text(function getName(d) { return d.submit.name; })
      .on('click', function onSubmit(d) {
        var formValues = getFormValues(this.parentElement, d.fields)
        d.submit.action(formValues);
      });

  };

  function setUpFields(d) {
    var fields = d3.select(this).selectAll('.field-group').data(d.fields);
    var newFields = fields.enter().append('div').classed('field-group', true);

    newFields.append('label')
      .attr({
        id: function getId(d) { return d.id + '_label'; },
        for: function getFor(d) { return d.id; }
      })
      .text(function getName(d) { return d.name; });

    newFields.append('input').attr('id', function getId(d) { return d.id; });

    fields.exit().remove();
  };

  function getFormValues(formEl, fields) {
    var valuesForFieldIds = {};
    var form = d3.select(formEl);

    function getFieldValueFromForm(field) {
      valuesForFieldIds[field.id] = form.select('#' + field.id).node().value;
    }

    fields.forEach(getFieldValueFromForm);

    return valuesForFieldIds;
  }

  return {
    init: init,
    load: load,
    newDocFormSel: newDocFormSel,
    controllerType: 'form'
  };
}

module.exports = createNewDocForm;
