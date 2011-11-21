(function() {
  var KnockMe, ObservableCollection, buildModelRelations, methods, observeModelAttributes, observeModelRelations, root;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  root = this;
  KnockMe = root.KnockMe = {};
  buildModelRelations = function(attributes) {
    var attrs, rel, relationName, relations, _ref, _results;
    relations = this.__proto__._relations;
    if (!(relations && relations.many)) {
      return;
    }
    _ref = relations.many;
    _results = [];
    for (relationName in _ref) {
      rel = _ref[relationName];
      attrs = _.clone(attributes[relationName]);
      delete attributes[relationName];
      _results.push(this[relationName] = new rel.collectionClass(attrs || [], {
        belongsTo: this
      }));
    }
    return _results;
  };
  KnockMe.Model = (function() {
    __extends(Model, Backbone.Model);
    Model.hasMany = function(relationName, collectionClass) {
      var _ref;
      if ((_ref = this.prototype._relations) == null) {
        this.prototype._relations = {
          many: {}
        };
      }
      return this.prototype._relations.many[relationName] = {
        collectionClass: collectionClass
      };
    };
    function Model(attributes, options) {
      var ret;
      buildModelRelations.call(this, attributes);
      ret = Backbone.Model.prototype.constructor.apply(this, arguments);
      this._observable = ko.observable(this.attributes);
      ret;
    }
    Model.prototype.change = function(options) {
      Backbone.Model.prototype.change.apply(this, arguments);
      return this._observable(this.attributes);
    };
    return Model;
  })();
  KnockMe.Collection = (function() {
    __extends(Collection, Backbone.Collection);
    function Collection() {
      var ev, ret, _i, _len, _ref;
      ret = Backbone.Collection.prototype.constructor.apply(this, arguments);
      this._observable = ko.observableArray(this.models);
      _ref = ['add', 'remove', 'reset'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ev = _ref[_i];
        this.bind(ev, __bind(function() {
          return this._observable(this.models);
        }, this));
      }
      ret;
    }
    return Collection;
  })();
  observeModelAttributes = function(model) {
    var dep, k, v, __proto, _ref, _results;
    __proto = this.__proto__;
    _ref = model.attributes;
    _results = [];
    for (k in _ref) {
      v = _ref[k];
      dep = function(k) {
        var obs, xform;
        obs = model._observable;
        xform = __proto[k] || function() {
          return this.valueOf();
        };
        return function() {
          return xform.call(obs()[k], obs());
        };
      };
      _results.push(this[k] = ko.dependentObservable(dep(k), this));
    }
    return _results;
  };
  methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find', 'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex', 'toArray', 'size', 'first', 'rest', 'last', 'without', 'indexOf', 'lastIndexOf', 'isEmpty', 'groupBy'];
  ObservableCollection = function(name, collection, vm) {
    var dep, obs, ret, vm_klass;
    vm_klass = vm.__proto__[name] || vm.__proto__.constructor;
    obs = collection._observable;
    dep = function() {
      return function() {
        return _.map(collection._observable(), function(m) {
          return new vm_klass({
            model: m
          });
        });
      };
    };
    ret = ko.dependentObservable(dep(), vm);
    _.each(methods, function(method) {
      return ret[method] = function() {
        return _[method].apply(_, [ret()].concat(_.toArray(arguments)));
      };
    });
    return ret;
  };
  observeModelRelations = function(model) {
    var relName, relOpts, _ref, _results;
    if (!(model._relations && model._relations.many)) {
      return;
    }
    _ref = model._relations.many;
    _results = [];
    for (relName in _ref) {
      relOpts = _ref[relName];
      if (!(model[relName] && _.isFunction(model[relName]._observable))) {
        throw "relations must be observables too...";
      }
      _results.push(this[relName] = new ObservableCollection(relName, model[relName], this));
    }
    return _results;
  };
  KnockMe.ViewModel = (function() {
    function ViewModel(options) {
      var col_name;
      if (options.model) {
        this.model = options.model;
        observeModelRelations.call(this, options.model);
        observeModelAttributes.call(this, options.model);
      }
      if (options.collection) {
        this.collection = options.collection;
        col_name = options.collection_name || "items";
        this[col_name] = new ObservableCollection(col_name, options.collection, this);
      }
      this.el = options.el;
      this.initialize.apply(this, arguments);
    }
    ViewModel.prototype.initialize = function() {};
    ViewModel.prototype.render = function(tpl) {
      this.view = new KnockMe.View({
        el: this.el,
        model: this
      });
      return this.view.render(tpl);
    };
    return ViewModel;
  })();
  KnockMe.View = (function() {
    __extends(View, Backbone.View);
    function View() {
      View.__super__.constructor.apply(this, arguments);
    }
    View.prototype.render = function(tpl) {
      if (tpl) {
        if (!_.isFunction(tpl)) {
          tpl = _.template(tpl, this);
        }
        $(this.el).html(_.template(tpl, this));
      }
      ko.applyBindings(this.model, $(this.el)[0]);
      return this;
    };
    return View;
  })();
  KnockMe.ViewModel.extend = Backbone.View.extend;
}).call(this);
