root = @

KnockMe = root.KnockMe = {}

# Model

buildModelRelations = (attributes)->
  relations = @__proto__._relations
  return unless relations && relations.many
  for relationName, rel of relations.many
    attrs = _.clone(attributes[relationName])
    delete attributes[relationName]
    @[relationName] = new rel.collectionClass(attrs || [], belongsTo: @)

class KnockMe.Model extends Backbone.Model
  @hasMany: (relationName, collectionClass)->
    @::_relations ?= { many: {} }
    @::_relations.many[relationName] = { collectionClass: collectionClass }
  
  constructor: (attributes, options)->
    buildModelRelations.call(this, attributes)
    ret = Backbone.Model.prototype.constructor.apply(this, arguments)
    @_observable = ko.observable(@attributes)
    ret
  
  change: (options)->
    Backbone.Model.prototype.change.apply(this, arguments)
    @_observable(@attributes)
    
# Collection

class KnockMe.Collection extends Backbone.Collection
  
  constructor: ->
    ret = Backbone.Collection.prototype.constructor.apply(this, arguments)
    @_observable = ko.observableArray(@models)
    @bind(ev, => @_observable(@models)) for ev in ['add', 'remove', 'reset']
    ret
    

# ViewModel

observeModelAttributes = (model)->
  __proto = @__proto__
  for k,v of model.attributes
    dep = (k)->
      obs = model._observable
      xform = __proto[k] || -> @.valueOf()
      -> xform.call(obs()[k], obs())
    @[k] = ko.dependentObservable(dep(k), @)

methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find', 'detect',
  'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include',
  'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex', 'toArray', 'size',
  'first', 'rest', 'last', 'without', 'indexOf', 'lastIndexOf', 'isEmpty', 'groupBy']

ObservableCollection = (name, collection, vm)->
  vm_klass = vm.__proto__[name] || vm.__proto__.constructor
  obs = collection._observable
  dep = -> ()-> _.map collection._observable(), (m)-> new vm_klass(model: m)
  ret = ko.dependentObservable(dep(), vm)
  # TODO: find a more efficient way to do that...
  _.each methods, (method)->
    ret[method] = ->
      _[method].apply(_, [ret()].concat(_.toArray(arguments)))
  return ret


observeModelRelations = (model)->
  return unless model._relations && model._relations.many
  for relName, relOpts of model._relations.many
    throw "relations must be observables too..." unless model[relName] && _.isFunction(model[relName]._observable)
    @[relName] = new ObservableCollection(relName, model[relName], @)

class KnockMe.ViewModel
  
  constructor: (options)->
    if options.model
      @model = options.model
      observeModelRelations.call(this, options.model)
      observeModelAttributes.call(this, options.model)
    if options.collection
      @collection = options.collection
      col_name = options.collection_name || "items"
      @[col_name] = new ObservableCollection(col_name, options.collection, @)
    @el = options.el
    @initialize.apply(this, arguments)
  
  initialize: ->
    
  render: (tpl)->
    @view = new KnockMe.View(el: @el, model: this)
    @view.render(tpl)
    
# View
    
class KnockMe.View extends Backbone.View
  
  render: (tpl)->
    if tpl
      tpl = _.template(tpl, @) unless _.isFunction(tpl)
      $(@el).html(_.template(tpl, @))
    ko.applyBindings(@model, $(@el)[0])
    @
    
KnockMe.ViewModel.extend = Backbone.View.extend