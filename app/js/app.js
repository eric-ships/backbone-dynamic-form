// Changes I see happening next iteration
// - abstract form outside of view
// - create a better item model/form with nested models

var Item = Backbone.Model.extend({
  urlRoot: 'http://127.0.0.1:8000/api/item',

  parse: function(response) {
    return response.item;
  },

  initialize: function(options) {
  },

  save: function() {
    console.log(this.attributes);
  }

});

var ItemFormView = Backbone.View.extend({
  events: {
    'submit': 'onFormSubmit'
  },

  el: '#container-content',

  initialize: function(options) {    
    this.enumsJSON = {};
    this.loadEnumsJSON();
    this.listenTo(this.model, "change", this.render);
  },

  render: function() {
    var formCreated = this.createForm();
    if ( formCreated ) {
      var form = this.form;
      this.$el.html(form.el);
      this.toggleMeasurementUnit(form, this.model.attributes.measurement.unit);
      this.toggleMeasurementFields(form, this.model.attributes.measurement.shape);
    } else {
      this.$el.html("<div>Loading...</div>");
    }

    return this;
  },

  onFormSubmit: function(e) {
    e.preventDefault();
    this.model.set(this.form.getValue());

    var restricted = this.model.attributes.material.restricted;
    if ( restricted ) {
      this.model.get('material').restricted = "Y";
    } else {
      this.model.get('material').restricted = "N";
    }

    this.model.save();
  },

  loadEnumsJSON: function() {
    var that = this;
    $.getJSON( "http://127.0.0.1:8000/api/enums", function(data) {
      that.enumsJSON = data;
    }).done(function(){
      that.render();
    });
  },

  createFormSchema: function() {
    var enums = this.enumsJSON;
    var attributes = this.model.attributes;
    var formSchema = {};
    var measurementFieldsTpl = _.template('\
      <div class="form-group measurement-hidden field-<%= key %>">\
        <label class="control-label" for="<%= editorId %>">\
          <% if (titleHTML){ %><%= titleHTML %>\
          <% } else { %><%- title %><% } %>\
        </label>\
        <span data-editor></span>\
        <div class="unit"></div>\
        <p class="help-block" data-error></p>\
        <p class="help-block"><%= help %></p>\
      </div>\
    ');

    for (var key in attributes) {
      if ( key !== "id" ) {
        switch(key) {
          case "description":
            formSchema[key] = { type: "TextArea" };
            break;
          case "dealerInternalNotes":
            formSchema[key] = {
              type: "TextArea",
              title: "Internal Notes"
            };
            break;
          case "material":
            formSchema[key] = {
              type: "Object",
              subSchema: {
                description: {
                  title: "Material",
                  type: "Select",
                  options: enums[key]
                },
                restricted: {
                  titleHTML: "<div>Check this box<span style='font-weight: normal;'>&nbsp; if the listing contains or may contain restricted materials</span></div>",
                  type: "Checkbox"
                }
              }
            }
            break;
          case "measurement":
            formSchema[key] = {
              type: "Object",
              subSchema: {
                unit: {
                  titleHTML: "<span style='font-weight: normal;'>Measurements are in:</span>",
                  type: "Radio",
                  options: enums[key]["unit"]
                },
                shape: {
                  titleHTML: "<span style='font-weight: normal;'>Measured item is:</span>",
                  type: "Radio",
                  options: enums[key]["shape"]
                },
                length: {
                  template: measurementFieldsTpl
                },
                depth: {
                  template: measurementFieldsTpl
                },
                height: {
                  template: measurementFieldsTpl
                },
                diameter: {
                  template: measurementFieldsTpl
                }
              }
            };
            break;
          case "condition":
            formSchema[key] = {
              type: "Object",
              subSchema: {
                description: {
                  titleHTML: "Condition<span style='font-weight: normal;'><i>&nbsp;(Select One)</i></span>",
                  type: "Radio",
                  options: enums[key]["description"]
                }
              }
            }
            break;
          default:
            formSchema[key] = { type: "Text" };
        }
      }
    }

    return formSchema;
  },

  convertModelData: function() {
    // converting the restricted "N" for the input data
    var data = JSON.parse(JSON.stringify(this.model.attributes));

    if ( data.material.restricted === "N" ) {
      delete data.material.restricted;
    }

    return data;
  },

  toggleMeasurementUnit: function(form, unit) {
    // do not want to rebind multiple times
    form.off('measurement:unit:change');

    // initially loads in. or cm. if there is data
    if ( unit === "in" ) {
      $('.form-group.measurement-hidden .unit').html('in.');
    } else if ( unit === "cm" ) {
      $('.form-group.measurement-hidden .unit').html('cm.');
    }

    // toggles between in. and cm.
    var that = this;
    form.on('measurement:unit:change', function(form) {
      unit = form.getValue('measurement').unit;
      that.toggleMeasurementUnit(form, unit);
    });
  },

  toggleMeasurementFields: function(form, shape) {
    // initially displays the dimension fields if shape is checked
    // otherwise, displays it forever when a radio is picked

    if ( shape === "Circular" || shape === "Rectangular" ) {
      $('.form-group.measurement-hidden').css('display', 'inline-block');
    } else {
      form.on('measurement:shape:change', function(form) {
        $('.form-group.measurement-hidden').css('display', 'inline-block');
        form.off('measurement:shape:change');
      });
    }
  },

  createForm: function() {
    // if enums.json is loaded, it will create the form
    if ( !$.isEmptyObject(this.enumsJSON) ) {
      var formSchema = this.createFormSchema();
      var modelData = this.convertModelData();
      this.form = new Backbone.Form({
        schema: formSchema,
        data: modelData,
        submitButton: 'Save'
      }).render();
      return true;
    }
    return false;
  }

});

$(document).ready(function() {
  
  var item = new Item();
  item.fetch({
    reset: true
  });

  var itemFormView = new ItemFormView({
    model: item
  });

});
