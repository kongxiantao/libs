//     Backbone.js 0.3.3
//     (c) 2010 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://documentcloud.github.com/backbone
/*

说明 简介
简单术语翻译对照：散列表（hash） 模型（model） 视图（view） 集合（collection） 回调函数（callback） 绑定（bind）

Backbone 为复杂Javascript应用程序提供模型(models)、集合(collections)、视图(views)的结构。
其中模型用于绑定键值数据和自定义事件；集合附有可枚举函数的丰富API； 
视图可以声明事件处理函数，并通过RESRful JSON接口连接到应用程序。

当我们开发含有大量Javascript的web应用程序时，首先你需要做的事情之一便是停止向DOM对象附加数据。
通过复杂多变的jQuery选择符和回调函数创建Javascript应用程序，包括在HTML UI，Javascript逻辑和数据之间保持同步，都不复杂。
但对富客户端应用来说，良好的架构通常是有很多益处的。

Backbone将数据呈现为模型, 你可以创建模型、对模型进行验证和销毁，甚至将它保存到服务器。
当UI的变化引起模型属性改变时，模型会触发"change"事件；
所有显示模型数据的 视图 会接收到该事件的通知，继而视图重新渲染。 
你无需查找DOM来搜索指定id的元素去手动更新HTML。 — 当模型改变了，视图便会自动变化。
*/
(function () {
    
    // Initial Setup
    // -------------
  //命名空间处理
    // The top-level namespace. All public Backbone classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Backbone;
    if (typeof exports !== 'undefined') {
        Backbone = exports;
    } else {
        Backbone = this.Backbone = {};
    }
    
    // Current version of the library. Keep in sync with `package.json`.
    Backbone.VERSION = '0.3.3';
    
    // Require Underscore, if we're on the server, and it's not already present.
    var _ = this._;
    if (!_ && (typeof require !== 'undefined'))
        _ = require("underscore")._;
    
    // For Backbone's purposes, either jQuery or Zepto owns the `$` variable.
    var $ = this.jQuery || this.Zepto;
    
    // Turn on `emulateHTTP` to use support legacy（传统） HTTP servers. Setting this option will
    // fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and set a
    // `X-Http-Method-Override` header.
	// emulate 仿真
	/*
	老的浏览器不支持 Backbone 默认的 REST/HTTP，此时可以开启 Backbone.emulateHTTP 。 
	设置该选项将通过 POST 方法伪造 PUT 和 DELETE 请求，此时该请求会向服务器传入名为 _method 的参数。 
	设置该选项同时也会向服务器发送 X-HTTP-Method-Override 头。
	*/
    Backbone.emulateHTTP = false;
    
    // Turn on `emulateJSON` to support legacy servers that can't deal with direct
    // `application/json` requests ... will encode the body as
    // `application/x-www-form-urlencoded` instead and will send the model in a
    // form param named `model`.
	/*
	同样老的浏览器也不支持发送 application/json 编码的请求， 设置 Backbone.emulateJSON = true; 
	后 JSON 模型会被序列化为 model 参数， 请求会按照 application/x-www-form-urlencoded 的内容类型发送，就像提交表单一样。
	*/
    Backbone.emulateJSON = false;
    
    // Backbone.Events
    // -----------------
    
    // A module that can be mixed in to *any object* in order to provide it with
    // custom events. You may `bind` or `unbind` a callback function to an event;
    // `trigger`-ing an event fires all callbacks in succession.
    //
    //     var object = {};
    //     _.extend(object, Backbone.Events);
    //     object.bind('expand', function(){ alert('expanded'); });
    //     object.trigger('expand');
    //
	/*
	Events 是一个可以被mix到任意对象的模块，它拥有让对象绑定和触发自定义事件的能力。 
	事件在被绑定之前是不需要事先声明的，还可以携带参数。
	*/
    Backbone.Events = {
        
        // Bind an event, specified by a string name, `ev`, to a `callback` function.
        // Passing `"all"` will bind the callback to all events fired.
		/*
		绑定 callback 函数到 object 对象。 当事件触发时执行回调函数 callback 。
		如果一个页面中有大量不同的事件，按照惯例使用冒号指定命名空间： "poll:start", 或 "change:selection"
		当 callback 执行时提供第三个可选参数，可以为 this 指定上下文： model.bind('change', this.render, this)
		绑定到特殊事件 "all" 的回调函数会在任意事件发生时被触发，其第一个参数为事件的名称。 
		*/
        bind : function (ev, callback) {
            var calls = this._callbacks || (this._callbacks = {});
            var list = this._callbacks[ev] || (this._callbacks[ev] = []);
            list.push(callback);
            return this;
        },
        
        // Remove one or many callbacks. If `callback` is null, removes all
        // callbacks for the event. If `ev` is null, removes all bound callbacks
        // for all events.
		/*
		从 object 对象移除先前绑定的 callback 函数。如果不指定第二个参数，所有 event 事件绑定的回调函数都被移除。 
		如果第一个参数也不指定，对象所绑定的所有回调函数都将被移除。
		*/
        unbind : function (ev, callback) {
            var calls;
            if (!ev) {
                this._callbacks = {};
            } else if (calls = this._callbacks) {
                if (!callback) {
                    calls[ev] = [];
                } else {
                    var list = calls[ev];
                    if (!list)
                        return this;
                    for (var i = 0, l = list.length; i < l; i++) {
                        if (callback === list[i]) {
                            list.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            return this;
        },
        
        // Trigger an event, firing all bound callbacks. Callbacks are passed the
        // same arguments as `trigger` is, apart from the event name.
        // Listening for `"all"` passes the true event name as the first argument.
		/*
		触发 event 事件的回调函数。后续传入 trigger 的参数会被依次传入事件回调函数。
		*/
        trigger : function (ev) {
            var list,
            calls,
            i,
            l;
            if (!(calls = this._callbacks))
                return this;
            if (list = calls[ev]) {
                for (i = 0, l = list.length; i < l; i++) {
                    list[i].apply(this, Array.prototype.slice.call(arguments, 1));
                }
            }
            if (list = calls['all']) {
                for (i = 0, l = list.length; i < l; i++) {
                    list[i].apply(this, arguments);
                }
            }
            return this;
        }
        
    };
    
    // Backbone.Model
    // --------------
    /*
	模型 是所有 Javascript 应用程序的核心，包括交互数据及相关的大量逻辑： 转换、验证、计算属性和访问控制。
	你可以用特定的方法扩展 Backbone.Model ， 模型 也提供了一组基本的管理变化的功能。
	*/
    // Create a new model, with defined attributes. A client id (`cid`)
    // is automatically generated and assigned for you.
    Backbone.Model = function (attributes, options) {
        attributes || (attributes = {});
        if (this.defaults)
            attributes = _.extend({}, this.defaults, attributes);
        this.attributes = {};
		//转以后的属性
        this._escapedAttributes = {};
        this.cid = _.uniqueId(/*ID的前缀*/'c');
        this.set(attributes, {
            silent : true //安静
        });
		//前一个属性组
        this._previousAttributes = _.clone(this.attributes);
        if (options && options.collection)
            this.collection = options.collection;
        this.initialize(attributes, options);
    };
    
	//给Model添加一些方法
	/*
	要创建自己的 模型 类，你可以扩展 Backbone.Model 并提供实例 属性 ， 以及可选的可以直接注册到构造函数的 类属性 (classProperties)。
	extend 可以正确的设置原型链，因此通过 extend 创建的子类 (subclasses) 也可以被深度扩展。
	*/
    // Attach all inheritable methods to the Model prototype.
    _.extend(Backbone.Model.prototype, Backbone.Events, {
        
        // A snapshot of the model's previous attributes, taken immediately
        // after the last `"change"` event was fired.
        _previousAttributes : null,
        
        // Has the item been changed since the last `"change"` event?
        _changed : false,
        
		//用自己的初始化逻辑覆盖这个方法
        // Initialize is an empty function by default. Override it with your own
        // initialization logic.
		/*当创建模型实例时，可以传入 属性 初始值，这些值会被 set 到模型。 如果定义了 initialize 函数，该函数会在模型创建后执行。*/
        initialize : function () {},
        
        // Return a copy of the model's `attributes` object.
		/*
		返回模型 attributes 副本的 JSON 字符串化形式。 
		它可用于模型的持久化、序列化，或者传递到视图前的扩充。 
		该方法的名称有点混乱，因为它事实上并不返回 JSON 字符串，但 JavaScript API for JSON.stringify 可以实现。
		*/
        toJSON : function () {
            return _.clone(this.attributes);
        },
        
        // Get the value of an attribute.
		/*从模型获取当前属性值，比如：csser.get("title")*/
        get : function (attr) {
            return this.attributes[attr];
        },
        
        // Get the HTML-escaped value of an attribute.
		/*与 get 类似, 但返回模型属性值的 HTML 转义后的版本。 如果将数据从模型插入 HTML，使用 escape 取数据可以避免 XSS 攻击.*/
        escape : function (attr) {
            var html;
            if (html = this._escapedAttributes[attr])
                return html;
            var val = this.attributes[attr];
            return this._escapedAttributes[attr] = escapeHTML(val == null ? '' : val);
        },
        //给模块添加属性
        // Set a hash of model attributes on the object, firing `"change"` unless you
        // choose to silence it.
		/*
		向模型设置一个或多个散列属性。 
		如果任何一个属性改变了模型的状态，在不传入 {silent: true} 选项参数的情况下，会触发 "change" 事件。 
		可以绑定事件到某个属性，例如：change:title，及 change:content。
		如果模型拥有 validate 方法， 那么属性验证会在 set 之前执行，如果验证失败，模型不会发生变化，这时 set 会返回 false。 
		也可以在选项中传入 error 回调函数，此时验证失败时会执行它而不触发 "error" 事件。
		*/
        set : function (attrs, options) {
            
            // Extract attributes and options.
            options || (options = {});
            if (!attrs)
                return this;
            if (attrs.attributes)
                attrs = attrs.attributes;
            var now = this.attributes,
            escaped = this._escapedAttributes;
            
            // Run validation.
            if (!options.silent && this.validate && !this._performValidation(attrs, options))
                return false;
            
            // Check for changes of `id`.
            if ('id' in attrs)
                this.id = attrs.id;
            
            // Update attributes.
            for (var attr in attrs) {
                var val = attrs[attr];
                if (!_.isEqual(now[attr], val)) {
                    now[attr] = val;
                    delete escaped[attr];
                    if (!options.silent) {
                        this._changed = true;
                        this.trigger('change:' + attr, this, val, options);
                    }
                }
            }
            
            // Fire the `"change"` event, if the model has been changed.
            if (!options.silent && this._changed)
                this.change(options);
            return this;
        },
        //模块删除属性
        // Remove an attribute from the model, firing `"change"` unless you choose
        // to silence it.
		/*从内部属性散列表中删除指定属性。 如果未设置 silent 选项，会触发 "change" 事件。*/
        unset : function (attr, options) {
            options || (options = {});
            var value = this.attributes[attr];
            
            // Run validation.
            var validObj = {};
            validObj[attr] = void 0;
            if (!options.silent && this.validate && !this._performValidation(validObj, options))
                return false;
            
            // Remove the attribute.
            delete this.attributes[attr];
            delete this._escapedAttributes[attr];
            if (!options.silent) {
                this._changed = true;
                this.trigger('change:' + attr, this, void 0, options);
                this.change(options);
            }
            return this;
        },
        
        // Clear all attributes on the model, firing `"change"` unless you choose
        // to silence it.
		/*从模型中删除所有属性。 如果未设置 silent 选项，会触发 "change" 事件。*/
        clear : function (options) {
            options || (options = {});
            var old = this.attributes;
            
            // Run validation.
            var validObj = {};
            for (attr in old)
                validObj[attr] = void 0;
            if (!options.silent && this.validate && !this._performValidation(validObj, options))
                return false;
            
            this.attributes = {};
            this._escapedAttributes = {};
            if (!options.silent) {
                this._changed = true;
                for (attr in old) {
                    this.trigger('change:' + attr, this, void 0, options);
                }
                this.change(options);
            }
            return this;
        },
        
        // Fetch the model from the server. If the server's representation (代表) of the
        // model differs from its current attributes, they will be overriden,
        // triggering a `"change"` event.
		/*
		从服务器重置模型状态。这对模型尚未填充数据，或者服务器端已有最新状态的情况很有用处。 
		如果服务器端状态与当前属性不同，则触发 "change" 事件。 
		选项的散列表参数接受 success 和 error 回调函数， 回调函数中可以传入 (model,response) 作为参数。
		*/
        fetch : function (options) {
            options || (options = {});
            var model = this;
            var success = function (resp) {
                if (!model.set(model.parse(resp), options))
                    return false;
                if (options.success)
                    options.success(model, resp);
            };
            var error = wrapError(options.error, model, options);
            (this.sync || Backbone.sync)('read', this, success, error);
            return this;
        },
        
        // Set a hash of model attributes, and sync the model to the server.
        // If the server returns an attributes hash that differs, the model's
        // state will be `set` again.
		/*
		通过委托 Backbone.sync 保存模型到数据库（或可替代的持久层）。 
		attributes 散列表 (在 set) 应当包含想要改变的属性，不涉及的键不会被修改。 
		如果模型含有 validate 方法，并且验证失败，模型不会保存。 
		如果模型 isNew, 保存将采用 "create" (HTTP POST) 方法, 如果模型已经在服务器存在，保存将采用 "update" (HTTP PUT) 方法.
		
		save 支持在选项散列表中传入 success 和 error 回调函数， 回调函数支持传入 (model, response) 作为参数。
		如果模型拥有 validate 方法并且验证失败，error 回调函数会执行。 如果服务端验证失败，返回非 200 的 HTTP 响应码，将产生文本或 JSON 的错误内容。
		*/
        save : function (attrs, options) {
            options || (options = {});
            if (attrs && !this.set(attrs, options))
                return false;
            var model = this;
            var success = function (resp) {
                if (!model.set(model.parse(resp), options))
                    return false;
                if (options.success)
                    options.success(model, resp);
            };
            var error = wrapError(options.error, model, options);
            var method = this.isNew() ? 'create' : 'update';
            (this.sync || Backbone.sync)(method, this, success, error);
            return this;
        },
        
        // Destroy this model on the server. Upon success, the model is removed
        // from its collection, if it has one.
		/*
		通过委托 HTTP DELETE 请求到 Backbone.sync 销毁服务器上的模型. 
		接受 success 和 error 回调函数作为选项散列表参数。 
		将在模型上触发 "destroy" 事件，该事件可以通过任意包含它的集合向上冒泡。
		*/
        destroy : function (options) {
            options || (options = {});
            var model = this;
            var success = function (resp) {
                if (model.collection)
                    model.collection.remove(model);
                if (options.success)
                    options.success(model, resp);
            };
            var error = wrapError(options.error, model, options);
            (this.sync || Backbone.sync)('delete', this, success, error);
            return this;
        },
        
        // Default URL for the model's representation on the server -- if you're
        // using Backbone's restful methods, override this to change the endpoint
        // that will be called.
		/*
		返回模型资源在服务器上位置的相对 URL 。 如果模型放在其它地方，可通过合理的逻辑重载该方法。 
		生成 URLs 的形式为："/[collection.url]/[id]"， 如果模型不是集合的一部分，则 URLs 形式为："/[urlRoot]/id"。

		由于是委托到 Collection#url 来生成 URL， 所以首先需要确认它是否定义过，或者所有模型共享一个通用根 URL 时，
		是否存在 urlRoot 属性。 例如，一个 id 为 101 的模型，存储在 url 为 "/documents/7/notes" 的 Backbone.Collection 中， 
		那么该模型的 URL 为："/documents/7/notes/101"
		*/
        url : function () {
            var base = getUrl(this.collection);
            if (this.isNew())
                return base;
            return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + this.id;
        },
        
        // **parse** converts a response into the hash of attributes to be `set` on
        // the model. The default implementation is just to pass the response along.
		/*
		parse 会在通过 fetch 从服务器返回模型数据，以及 save 时执行。 
		传入本函数的为原始 response 对象，并且应当返回可以 set 到模型的属性散列表。 
		默认实现是自动进行的，仅简单传入 JSON 响应。 如果需要使用已存在的 API，或者更好的命名空间响应，可以重载它。
		如果使用的 Rails 后端，需要注意 Rails's 默认的 to_json 实现已经包含了命名空间之下的模型属性。 
		对于无缝的后端集成环境禁用这种行为：
		*/
        parse : function (resp) {
            return resp;
        },
        
        // Create a new model with identical attributes to this one.
		/*返回与模型属性一致的新的实例。*/
        clone : function () {
            return new this.constructor(this);
        },
        
        // A model is new if it has never been saved to the server, and has a negative
        // ID.
		/*模型是否已经保存到服务器。 如果模型尚无 id，则被视为新的。*/
        isNew : function () {
            return !this.id;
        },
        
        // Call this method to manually fire a `change` event for this model.
        // Calling this will cause all objects observing the model to update.
		/*
		手动触发 "change" 事件。 如果已经在 set 函数传入选项参数 {silent: true} ， 当所有操作结束时，可以手动调用 model.change() 。
		*/
        change : function (options) {
            this.trigger('change', this, options);
            this._previousAttributes = _.clone(this.attributes);
            this._changed = false;
        },
        
        // Determine if the model has changed since the last `"change"` event.
        // If you specify an attribute name, determine if that attribute has changed.
		/*标识模型从上次 "change" 事件发生后是否改变过。 如果传入 attribute ，当指定属性改变后返回 true。*/
        hasChanged : function (attr) {
            if (attr)
                return this._previousAttributes[attr] != this.attributes[attr];
            return this._changed;
        },
        
        // Return an object containing all the attributes that have changed, or false
        // if there are no changed attributes. Useful for determining what parts of a
        // view need to be updated and/or what attributes need to be persisted to
        // the server.
		/*
		仅获取模型属性已改变的散列表。 或者也可以传入外来的 attributes 散列，返回该散列与模型不同的属性。
		一般用于指出视图的哪个部分已被更新，或者确定哪些需要与服务器进行同步。
		*/
        changedAttributes : function (now) {
            now || (now = this.attributes);
            var old = this._previousAttributes;
            var changed = false;
            for (var attr in now) {
                if (!_.isEqual(old[attr], now[attr])) {
                    changed = changed || {};
                    changed[attr] = now[attr];
                }
            }
            return changed;
        },
        
        // Get the previous value of an attribute, recorded at the time the last
        // `"change"` event was fired.
		/*在 "change" 事件发生的过程中，本方法可被用于获取已改变属性的旧值。*/
        previous : function (attr) {
            if (!attr || !this._previousAttributes)
                return null;
            return this._previousAttributes[attr];
        },
        
        // Get all of the attributes of the model at the time of the previous
        // `"change"` event.
		/*返回模型的上一个属性散列的副本。一般用于获取模型的不同版本之间的区别，或者当发生错误时回滚模型状态。*/
        previousAttributes : function () {
            return _.clone(this._previousAttributes);
        },
        
        // Run validation against a set of incoming attributes, returning `true`
        // if all is well. If a specific `error` callback has been passed,
        // call that instead of firing the general `"error"` event.
		/*
		该方法是未定义的，如果有在Javascript执行的需要，建议用自定义的验证逻辑重载它。 
		validate 会在 set 和 save 之前调用，并传入待更新的属性。 
		如果模型和属性通过验证，不返回任何值； 如果属性不合法，返回一个可选择的错误。
		该错误可以是简单的用于显示的字符串错误信息， 或者是一个可以描述错误详细的 error 对象。 
		如果 validate 返回错误，set 和 save 将不会执行。 失败的验证会触发一个 "error"事件。
		
		"error" 事件对模型和集合级别提供粗粒度的错误信息很有帮助， 但如果想设计更好的处理错误的特定视图，
		可以直接传入 error 回调函数重载事件。
		*/
        _performValidation : function (attrs, options) {
            var error = this.validate(attrs);
            if (error) {
                if (options.error) {
                    options.error(this, error);
                } else {
                    this.trigger('error', this, error, options);
                }
                return false;
            }
            return true;
        }
        
    });
    
    // Backbone.Collection
    // -------------------
    
    // Provides a standard collection class for our sets of models, ordered
    // or unordered. If a `comparator` is specified, the Collection will maintain
    // its models in sort order, as they're added and removed.
	/*
	集合是模型的有序组合，我们可以在集合上绑定 "change" 事件，从而当集合中的模型发生变化时获得通知，
	集合也可以监听 "add" 和 “remove" 事件， 从服务器更新，并能使用 Underscore.js 提供的方法
	集合中的模型触发的任何事件都可以在集合身上直接触发，所以我们可以监听集合中模型的变化：Documents.bind("change:selected", ...)
	*/
    Backbone.Collection = function (models, options) {
        options || (options = {});
        if (options.comparator) {
            this.comparator = options.comparator;
            delete options.comparator;
        }
        this._boundOnModelEvent = _.bind(this._onModelEvent, this);
        this._reset();
        if (models)
            this.refresh(models, {
                silent : true
            });
        this.initialize(models, options);
    };
    
    // Define the Collection's inheritable methods.
    _.extend(Backbone.Collection.prototype, Backbone.Events, {
        
        // The default model for a collection is just a **Backbone.Model**.
        // This should be overridden in most cases.
		/*
		指定集合的模型类。可以传入原始属性对象（和数组）来 add，create，以及 reset，传入的属性会被自动转换为适合的模型类型。
		*/
        model : Backbone.Model,
        
        // Initialize is an empty function by default. Override it with your own
        // initialization logic.
		/*
		当创建集合时，你可以选择传入初始的 模型 数组。集合的 comparator 函数也可以作为选项传入。 
		如果定义了 initialize 函数，会在集合创建时被调用。
		*/
        initialize : function () {},
        
        // The JSON representation of a Collection is an array of the
        // models' attributes.
		/*
		返回集合中包含的每个模型对象的数组。可用于集合的序列化和持久化。本方法名称容易引起混淆，因为它与 JavaScript's JSON API 命名相同.
		*/
        toJSON : function () {
            return this.map(function (model) {
                return model.toJSON();
            });
        },
        
        // Add a model, or list of models to the set. Pass **silent** to avoid
        // firing the `added` event for every new model.
		/*
		向集合中增加模型（或模型数组）。默认会触发 "add" 事件，可以传入 {silent : true} 关闭。 
		如果定义了 模型 属性，也可以传入原始的属性对象让其看起来像一个模型实例。 传入 {at: index} 可以将模型插入集合中特定的位置。
		*/
        add : function (models, options) {
            if (_.isArray(models)) {
                for (var i = 0, l = models.length; i < l; i++) {
                    this._add(models[i], options);
                }
            } else {
                this._add(models, options);
            }
            return this;
        },
        
        // Remove a model, or a list of models from the set. Pass silent to avoid
        // firing the `removed` event for every model removed.
		/*从集合中删除模型（或模型数组）。会触发 "remove" 事件，同样可以使用 silent 关闭。*/
        remove : function (models, options) {
            if (_.isArray(models)) {
                for (var i = 0, l = models.length; i < l; i++) {
                    this._remove(models[i], options);
                }
            } else {
                this._remove(models, options);
            }
            return this;
        },
        
        // Get a model from the set by id.
		/*返回集合中 id 为 id 的模型。*/
        get : function (id) {
            if (id == null)
                return null;
            return this._byId[id.id != null ? id.id : id];
        },
        
        // Get a model from the set by client id.
		/*
		通过指定客户id返回集合中的模型。客户id是指模型创建时自动生成的 .cid 属性。
		在模型尚未保存到服务器时其还没有id值，所以通过cid获取模型很有用处。
		*/
        getByCid : function (cid) {
            return cid && this._byCid[cid.cid || cid];
        },
        
        // Get the model at the given index.
		/*返回集合中指定索引的模型对象。不论你是否对模型进行了重新排序， at 始终返回其在集合中插入时的索引值。*/
        at : function (index) {
            return this.models[index];
        },
        
        // Force the collection to re-sort itself. You don't need to call this under normal
        // circumstances, as the set will maintain sort order as each item is added.
		/*
		强制对集合进行重排序。一般情况下不需要调用本函数，因为 comparator 函数会实时排序。 
		如果不指定 {silent: true} ，调用 sort 会触发集合的 "reset" 事件。
		*/
        sort : function (options) {
            options || (options = {});
            if (!this.comparator)
                throw new Error('Cannot sort a set without a comparator');
            this.models = this.sortBy(this.comparator);
            if (!options.silent)
                this.trigger('refresh', this, options);
            return this;
        },
        
        // Pluck an attribute from each model in the collection.
        /*从集合中的每个模型拉取 attribute。等价于调用 map，并从迭代器中返回单个属性。*/
		pluck : function (attr) {
            return _.map(this.models, function (model) {
                return model.get(attr);
            });
        },
        
        // When you have more items than you want to add or remove individually,
        // you can refresh the entire set with a new list of models, without firing
        // any `added` or `removed` events. Fires `refresh` when finished.
        refresh : function (models, options) {
            models || (models = []);
            options || (options = {});
            this._reset();
            this.add(models, {
                silent : true
            });
            if (!options.silent)
                this.trigger('refresh', this, options);
            return this;
        },
        
        // Fetch the default set of models for this collection, refreshing the
        // collection when they arrive.
		/*
		从服务器拉取集合的默认模型，成功接收数据后会重置（reset）集合。 options 支持 success 和 error 回调函数，
		回调函数接收 (collection, response) 作为参数。
		
		可以委托 Backbone.sync 在随后处理个性化需求。 处理 fetch 请求的服务器应当返回模型的 JSON 数组。
		fetch 的参数可以支持直接传入 jQuery.ajax 作为参数，所以拉取指定页码的集合数据可以这样写：。 
		Documents.fetch({data: {page: 3}})
		*/
        fetch : function (options) {
            options || (options = {});
            var collection = this;
            var success = function (resp) {
                collection.refresh(collection.parse(resp));
                if (options.success)
                    options.success(collection, resp);
            };
            var error = wrapError(options.error, collection, options);
            (this.sync || Backbone.sync)('read', this, success, error);
            return this;
        },
        
        // Create a new instance of a model in this collection. After the model
        // has been created on the server, it will be added to the collection.
		/*
		在集合中创建一个模型。 等价于用键值对象实例一个模型，然后将模型保存到服务器，保存成功后将模型增加到集合中。 
		如果验证失败会阻止模型创建，返回 false，否则返回该模型。 
		为了能正常运行，需要在集合中设置 model 属性。 create 方法接收键值对象或者已经存在尚未保存的模型对象作为参数。
		*/
        create : function (model, options) {
            var coll = this;
            options || (options = {});
            if (!(model instanceof Backbone.Model)) {
                model = new this.model(model, {
                        collection : coll
                    });
            } else {
                model.collection = coll;
            }
            var success = function (nextModel, resp) {
                coll.add(nextModel);
                if (options.success)
                    options.success(nextModel, resp);
            };
            return model.save(null, {
                success : success,
                error : options.error
            });
        },
        
        // **parse** converts a response into a list of models to be added to the
        // collection. The default implementation is just to pass it through.
        parse : function (resp) {
            return resp;
        },
        
        // Proxy to _'s chain. Can't be proxied the same way the rest of the
        // underscore methods are proxied because it relies on the underscore
        // constructor.
        chain : function () {
            return _(this.models).chain();
        },
        
        // Reset all internal state. Called when the collection is refreshed.
		/*
		每次一个的向集合做增删操作已经很好了，但有时会有很多的模型变化以至于需要对集合做大批量的更新操作。
		利用 reset 可将集合替换为新的模型（或键值对象），结束后触发 "reset" 事件。 
		传入 {silent: true} 忽略 "reset" 事件的触发。 不传入任何参数将清空整个集合。
		*/
        _reset : function (options) {
            this.length = 0;
            this.models = [];
            this._byId = {};
            this._byCid = {};
        },
        
        // Internal implementation of adding a single model to the set, updating
        // hash indexes for `id` and `cid` lookups.
        _add : function (model, options) {
            options || (options = {});
            if (!(model instanceof Backbone.Model)) {
                model = new this.model(model, {
                        collection : this
                    });
            }
            var already = this.getByCid(model);
            if (already)
                throw new Error(["Can't add the same model to a set twice", already.id]);
            this._byId[model.id] = model;
            this._byCid[model.cid] = model;
            model.collection = this;
            var index = this.comparator ? this.sortedIndex(model, this.comparator) : this.length;
            this.models.splice(index, 0, model);
            model.bind('all', this._boundOnModelEvent);
            this.length++;
            if (!options.silent)
                model.trigger('add', model, this, options);
            return model;
        },
        
        // Internal implementation of removing a single model from the set, updating
        // hash indexes for `id` and `cid` lookups.
        _remove : function (model, options) {
            options || (options = {});
            model = this.getByCid(model) || this.get(model);
            if (!model)
                return null;
            delete this._byId[model.id];
            delete this._byCid[model.cid];
            delete model.collection;
            this.models.splice(this.indexOf(model), 1);
            this.length--;
            if (!options.silent)
                model.trigger('remove', model, this, options);
            model.unbind('all', this._boundOnModelEvent);
            return model;
        },
        
        // Internal method called every time a model in the set fires an event.
        // Sets need to update their indexes when models change ids. All other
        // events simply proxy through.
        _onModelEvent : function (ev, model) {
            if (ev === 'change:id') {
                delete this._byId[model.previous('id')];
                this._byId[model.id] = model;
            }
            this.trigger.apply(this, arguments);
        }
        
    });
    
    // Underscore methods that we want to implement on the Collection.
    var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find', 'detect',
        'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include',
        'invoke', 'max', 'min', 'sortBy', 'sortedIndex', 'toArray', 'size',
        'first', 'rest', 'last', 'without', 'indexOf', 'lastIndexOf', 'isEmpty'];
    
    // Mix in each Underscore method as a proxy to `Collection#models`.
    _.each(methods, function (method) {
        Backbone.Collection.prototype[method] = function () {
            return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
        };
    });
    
    // Backbone.Controller
    // -------------------
    
    // Controllers map faux-URLs to actions, and fire events when routes are
    // matched. Creating a new one sets its `routes` hash, if not set statically.
    Backbone.Controller = function (options) {
        options || (options = {});
        if (options.routes)
            this.routes = options.routes;
        this._bindRoutes();
        this.initialize(options);
    };
    
    // Cached regular expressions for matching named param parts and splatted
    // parts of route strings.
    var namedParam = /:([\w\d]+)/g;
    var splatParam = /\*([\w\d]+)/g;
    
    // Set up all inheritable **Backbone.Controller** properties and methods.
    _.extend(Backbone.Controller.prototype, Backbone.Events, {
        
        // Initialize is an empty function by default. Override it with your own
        // initialization logic.
        initialize : function () {},
        
        // Manually bind a single named route to a callback. For example:
        //
        //     this.route('search/:query/p:num', 'search', function(query, num) {
        //       ...
        //     });
        //
		/*
		routes 将带参数的 URLs 映射到路由实例的方法上，这与 视图 的 事件键值对 非常类似。 
		路由可以包含参数，:param，它在斜线之间匹配 URL 组件。 路由也支持通配符，*splat，可以匹配多个 URL 组件。
		举个例子，路由 "search/:query/p:page" 能匹配 #search/obama/p2 , 这里传入了 "obama" 和 "2" 到路由对应的动作中去了。 
		"file/*path 路由可以匹配 #file/nested/folder/file.txt，这时传入动作的参数为 "nested/folder/file.txt"。
		当访问者点击浏览器后退按钮，或者输入 URL ，如果匹配一个路由，此时会触发一个基于动作名称的 事件， 
		其它对象可以监听这个路由并接收到通知。 下面的示例中，用户访问 #help/uploading 将从路由中触发 route:help 事件。
		
		为路由对象手动创建路由，route 参数可以是 路由字符串 或 正则表达式。 
		每个捕捉到的被传入的路由或正则表达式，都将作为参数传入回调函数（callback）。 
		一旦路由匹配，name 参数会触发 "route:name" 事件。
		*/
        route : function (route, name, callback) {
            Backbone.history || (Backbone.history = new Backbone.History);
            if (!_.isRegExp(route))
                route = this._routeToRegExp(route);
            Backbone.history.route(route, _.bind(function (fragment) {
                    var args = this._extractParameters(route, fragment);
                    callback.apply(this, args);
                    this.trigger.apply(this, ['route:' + name].concat(args));
                }, this));
        },
        
        // Simple proxy to `Backbone.history` to save a fragment into the history,
        // without triggering routes.
        saveLocation : function (fragment) {
            Backbone.history.saveLocation(fragment);
        },
        
        // Bind all defined routes to `Backbone.history`.
        _bindRoutes : function () {
            if (!this.routes)
                return;
            for (var route in this.routes) {
                var name = this.routes[route];
                this.route(route, name, this[name]);
            }
        },
        
        // Convert a route string into a regular expression, suitable for matching
        // against the current location fragment.
        _routeToRegExp : function (route) {
            route = route.replace(namedParam, "([^\/]*)").replace(splatParam, "(.*?)");
            return new RegExp('^' + route + '$');
        },
        
        // Given a route, and a URL fragment that it matches, return the array of
        // extracted parameters.
        _extractParameters : function (route, fragment) {
            return route.exec(fragment).slice(1);
        }
        
    });
    
    // Backbone.History
    // ----------------
    
    // Handles cross-browser history management, based on URL hashes. If the
    // browser does not support `onhashchange`, falls back to polling.
	/*
	History 作为全局路由服务用于处理 hashchange 事件或 pushState，匹配适合的路由，并触发回调函数。 
	我们不需要自己去做这些事情 — 如果使用带有键值对的 路由，Backbone.history 会被自动创建。

	Backbone 会自动判断浏览器对 pushState 的支持，以做内部的选择。 
	不支持 pushState 的浏览器将会继续使用基于猫点的 URL 片段， 如果兼容 pushState 的浏览器访问了某个 URL 猫点，
	将会被透明的转换为真实的 URL。 注意使用真实的 URLs 需要 web 服务器支持直接渲染那些页面，因此后端程序也需要做修改。 
	例如，如果有这样一个路由 /document/100，如果浏览器直接访问它， web 服务器必须能够处理该页面。 趋于对搜索引擎爬虫的兼容，
	让服务器完全为该页面生成静态 HTML 是非常好的做法 ... 
	但是如果要做的是一个 web 应用，只需要利用 Javascript 和 Backbone 视图将服务器返回的 REST 数据渲染就很好了。
	*/
    Backbone.History = function () {
        this.handlers = [];
        this.fragment = this.getFragment();
        _.bindAll(this, 'checkUrl');
    };
    
    // Cached regex for cleaning hashes.
    var hashStrip = /^#*/;
    
    // Set up all inheritable **Backbone.History** properties and methods.
    _.extend(Backbone.History.prototype, {
        
        // The default interval to poll for hash changes, if necessary, is
        // twenty times a second.
        interval : 50,
        
        // Get the cross-browser normalized URL fragment.
        getFragment : function (loc) {
            return (loc || window.location).hash.replace(hashStrip, '');
        },
        
        // Start the hash change handling, returning `true` if the current URL matches
        // an existing route, and `false` otherwise.
		/*
		当所有的 路由 创建并设置完毕，调用 Backbone.history.start() 开始监控 hashchange 事件并分配路由。
		需要指出的是，如果想在应用中使用 HTML5 支持的 pushState，只需要这样做：Backbone.history.start({pushState : true}) 。

		如果应用不是基于域名的根路径 /，需要告诉 History 基于什么路径： Backbone.history.start({pushState: true, root: "/public/search/"})

		当执行后，如果某个路由成功匹配当前 URL，Backbone.history.start() 返回 true。 如果没有定义的路由匹配当前 URL，返回 false。

		如果服务器已经渲染了整个页面，但又不希望开始 History 时触发初始路由，传入 silent : true 即可。
		*/
        start : function () {
            var docMode = document.documentMode;
            var oldIE = ($.browser.msie && (!docMode || docMode <= 7));
            if (oldIE) {
                this.iframe = $('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
            }
            if ('onhashchange' in window && !oldIE) {
                $(window).bind('hashchange', this.checkUrl);
            } else {
                setInterval(this.checkUrl, this.interval);
            }
            return this.loadUrl();
        },
        
        // Add a route to be tested when the hash changes. Routes are matched in the
        // order they are added.
        route : function (route, callback) {
            this.handlers.push({
                route : route,
                callback : callback
            });
        },
        
        // Checks the current URL to see if it has changed, and if it has,
        // calls `loadUrl`, normalizing across the hidden iframe.
        checkUrl : function () {
            var current = this.getFragment();
            if (current == this.fragment && this.iframe) {
                current = this.getFragment(this.iframe.location);
            }
            if (current == this.fragment ||
                current == decodeURIComponent(this.fragment))
                return false;
            if (this.iframe) {
                window.location.hash = this.iframe.location.hash = current;
            }
            this.loadUrl();
        },
        
        // Attempt to load the current URL fragment. If a route succeeds with a
        // match, returns `true`. If no defined routes matches the fragment,
        // returns `false`.
        loadUrl : function () {
            var fragment = this.fragment = this.getFragment();
            var matched = _.any(this.handlers, function (handler) {
                    if (handler.route.test(fragment)) {
                        handler.callback(fragment);
                        return true;
                    }
                });
            return matched;
        },
        
        // Save a fragment into the hash history. You are responsible for properly
        // URL-encoding the fragment in advance. This does not trigger
        // a `hashchange` event.
        saveLocation : function (fragment) {
            fragment = (fragment || '').replace(hashStrip, '');
            if (this.fragment == fragment)
                return;
            window.location.hash = this.fragment = fragment;
            if (this.iframe && (fragment != this.getFragment(this.iframe.location))) {
                this.iframe.document.open().close();
                this.iframe.location.hash = fragment;
            }
        }
        
    });
    
    // Backbone.View
    // -------------
    
    // Creating a Backbone.View creates its initial element outside of the DOM,
    // if an existing element is not provided...
	/*
	Backbone 视图的使用相当方便 — 它不会影响任何的 HTML 或 CSS 代码，并且可以与任意 Javascript 模板引擎兼容。 
	基本的做法就是，将界面组织到逻辑视图，之后是模型，当模型数据发生改变，视图立刻自动更新，这一切都不需要重绘页面。 
	我们再也不必钻进 JSON 对象中，查找 DOM 元素，手动更新 HTML 了，
	通过绑定视图的 render 函数到模型的 "change" 事件 — 模型数据会即时的显示在 UI 中。
	*/
    Backbone.View = function (options) {
        this._configure(options || {});
        this._ensureElement();
        this.delegateEvents();
        this.initialize(options);
    };
    
    // Element lookup, scoped to DOM elements within the current view.
    // This should be prefered to global lookups, if you're dealing with
    // a specific view.
    var selectorDelegate = function (selector) {
        return $(selector, this.el);
    };
    
    // Cached regex to split keys for `delegate`.
    var eventSplitter = /^(\w+)\s*(.*)$/;
    
    // Set up all inheritable **Backbone.View** properties and methods.
	/*
	创建自定义的视图类。 通常我们需要重载 render 函数，声明 事件， 以及通过 tagName，className，或 id 为视图指定根元素。
	*/
    _.extend(Backbone.View.prototype, Backbone.Events, {
        
        // The default `tagName` of a View's element is `"div"`.
        tagName : 'div',
        
        // Attach the `selectorDelegate` function as the `$` property.
        $ : selectorDelegate,
        
        // Initialize is an empty function by default. Override it with your own
        // initialization logic.
		/*
		每次实例化一个视图时，传入的选项参数会被注册到 this.options 中以备后用。 
		这里有多个特殊的选项，如果传入，则直接注册到视图中去： model, collection, el, id, className, 以及 tagName. 
		如果视图定义了 initialize 函数，当视图实例化时该函数便立刻执行。 
		如果希望创建一个指向 DOM 中已存在的元素的视图，传入该元素作为选项： new View({el: existingElement})
		*/
        initialize : function () {},
        
        // **render** is the core function that your view should override, in order
        // to populate its element (`this.el`), with the appropriate HTML. The
        // convention is for **render** to always return `this`.
		/*
		render 默认实现是没有操作的。 重载本函数可以实现从模型数据渲染视图模板，并可用新的 HTML 更新 this.el。 
		推荐的做法是在 render 函数的末尾 return this 以开启链式调用。
		
		Backbone 并不知道开发者使用何种模板引擎。 
		render 函数中可以采用拼字符串，或者利用 document.createElement 创建 DOM 树等等。 
		但还是建议选择一个好的 Javascript 模板引擎。 Mustache.js, Haml-js, 以及 Eco 都是很好的选择。 
		因为 Underscore.js 已经引入页面了， 所以为了防止 XSS 攻击带给数据的安全威胁，_.template 可以使用并是一个很好的选择。
		*/
        render : function () {
            return this;
        },
        
        // Remove this view from the DOM. Note that the view isn't present in the
        // DOM by default, so calling this method may be a no-op.
		/*从 DOM 中移除视图。它等价与下面的语句： $(view.el).remove();*/
        remove : function () {
            $(this.el).remove();
            return this;
        },
        
        // For small amounts of DOM Elements, where a full-blown template isn't
        // needed, use **make** to manufacture elements, one at a time.
        //
        //     var el = this.make('li', {'class': 'row'}, this.model.escape('title'));
        //
		/*借助给定的元素类型（tagName），以及可选的 attributes 和 HTML 内容创建 DOM 元素。 通常用于内部创建初始的 view.el。*/
        make : function (tagName, attributes, content) {
            var el = document.createElement(tagName);
            if (attributes)
                $(el).attr(attributes);
            if (content)
                $(el).html(content);
            return el;
        },
        
        // Set callbacks, where `this.callbacks` is a hash of
        //
        // *{"event selector": "callback"}*
        //
        //     {
        //       'mousedown .title':  'edit',
        //       'click .button':     'save'
        //     }
        //
        // pairs. Callbacks will be bound to the view, with `this` set properly.
        // Uses event delegation for efficiency.
        // Omitting the selector binds the event to `this.el`.
        // This only works for delegate-able events: not `focus`, `blur`, and
        // not `change`, `submit`, and `reset` in Internet Explorer.
		/*
		采用 jQuery 的delegate 函数来为视图内的 DOM 事件提供回调函数声明。 
		如果未传入 events 对象，使用 this.events 作为事件源。 
		事件对象的书写格式为 {"event selector" : "callback"}。 
		省略 selector 则事件被绑定到视图的根元素（this.el）。 
		默认情况下，delegateEvents 会在视图的构造函数内被调用，因此如果有 events 对象，所有的 DOM 事件已经被连接， 
		并且我们永远不需要去手动调用本函数。

		events 属性也可以被定义成返回 events 对象的函数，这样让我们定义事件，以及实现事件的继承变得更加方便。

		视图 渲染 期间使用 delegateEvents 相比用 jQuery 向子元素绑定事件有更多优点。 
		所有注册的函数在传递给 jQuery 之前已被绑定到视图上，因此当回调函数执行时，this 仍将指向视图对象。 
		当 delegateEvents 再次运行，此时或许需要一个不同的 events 对象，所以所有回调函数将被移除，
		然后重新委托 — 这对模型不同行为也不同的视图挺有用处。
		*/
        delegateEvents : function (events) {
            if (!(events || (events = this.events)))
                return;
            $(this.el).unbind();
            for (var key in events) {
                var methodName = events[key];
                var match = key.match(eventSplitter);
                var eventName = match[1],
                selector = match[2];
                var method = _.bind(this[methodName], this);
                if (selector === '') {
                    $(this.el).bind(eventName, method);
                } else {
                    $(this.el).delegate(selector, eventName, method);
                }
            }
        },
        
        // Performs the initial configuration of a View with a set of options.
        // Keys with special meaning *(model, collection, id, className)*, are
        // attached directly to the view.
        _configure : function (options) {
            if (this.options)
                options = _.extend({}, this.options, options);
            if (options.model)
                this.model = options.model;
            if (options.collection)
                this.collection = options.collection;
            if (options.el)
                this.el = options.el;
            if (options.id)
                this.id = options.id;
            if (options.className)
                this.className = options.className;
            if (options.tagName)
                this.tagName = options.tagName;
            this.options = options;
        },
        
        // Ensure that the View has a DOM element to render into.
        _ensureElement : function () {
            if (this.el)
                return;
            var attrs = {};
            if (this.id)
                attrs.id = this.id;
            if (this.className)
                attrs["class"] = this.className;
            this.el = this.make(this.tagName, attrs);
        }
        
    });
    
    // The self-propagating extend function that Backbone classes use.
    var extend = function (protoProps, classProps) {
        var child = inherits(this, protoProps, classProps);
        child.extend = extend;
        return child;
    };
    
    // Set up inheritance for the model, collection, and view.
    Backbone.Model.extend = Backbone.Collection.extend =
        Backbone.Controller.extend = Backbone.View.extend = extend;
    
    // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
    var methodMap = {
        'create' : 'POST',
        'update' : 'PUT',
        'delete' : 'DELETE',
        'read' : 'GET'
    };
    
    // Backbone.sync
    // -------------
    
    // Override this function to change the manner in which Backbone persists
    // models to the server. You will be passed the type of request, and the
    // model in question. By default, uses makes a RESTful Ajax request
    // to the model's `url()`. Some possible customizations could be:
    //
    // * Use `setTimeout` to batch rapid-fire updates into a single request.
    // * Send up the models as XML instead of JSON.
    // * Persist models via WebSockets instead of Ajax.
    //
    // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
    // as `POST`, with a `_method` parameter containing the true HTTP method,
    // as well as all requests with the body as `application/x-www-form-urlencoded` instead of
    // `application/json` with the model in a param named `model`.
    // Useful when interfacing with server-side languages like **PHP** that make
    // it difficult to read the body of `PUT` requests.
	/*
	Backbone.sync 是 Backbone 每次向服务器读取或保存模型时都要调用执行的函数。 
	默认情况下，它使用 (jQuery/Zepto).ajax 方法发送 RESTful json 请求。 
	如果想采用不同的持久化方案，比如 WebSockets, XML, 或 Local Storage，我们可以重载该函数。
	*/
	
    Backbone.sync = function (method, model, success, error) {
        var type = methodMap[method];
        var modelJSON = (method === 'create' || method === 'update') ?
        JSON.stringify(model.toJSON()) : null;
        
        // Default JSON-request options.
        var params = {
            url : getUrl(model),
            type : type,
            contentType : 'application/json',
            data : modelJSON,
            dataType : 'json',
            processData : false,
            success : success,
            error : error
        };
        
        // For older servers, emulate JSON by encoding the request into an HTML-form.
        if (Backbone.emulateJSON) {
            params.contentType = 'application/x-www-form-urlencoded';
            params.processData = true;
            params.data = modelJSON ? {
                model : modelJSON
            }
             : {};
        }
        
        // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
        // And an `X-HTTP-Method-Override` header.
        if (Backbone.emulateHTTP) {
            if (type === 'PUT' || type === 'DELETE') {
                if (Backbone.emulateJSON)
                    params.data._method = type;
                params.type = 'POST';
                params.beforeSend = function (xhr) {
                    xhr.setRequestHeader("X-HTTP-Method-Override", type);
                };
            }
        }
        
        // Make the request.
        $.ajax(params);
    };
    
    // Helpers
    // -------
    
    // Shared empty constructor function to aid in prototype-chain creation.
    var ctor = function () {};
    
    // Helper function to correctly set up the prototype chain, for subclasses.
    // Similar to `goog.inherits`, but uses a hash of prototype properties and
    // class properties to be extended.
    var inherits = function (parent, protoProps, staticProps) {
        var child;
        
        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call `super()`.
        if (protoProps && protoProps.hasOwnProperty('constructor')) {
            child = protoProps.constructor;
        } else {
            child = function () {
                return parent.apply(this, arguments);
            };
        }
        
        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        
        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps)
            _.extend(child.prototype, protoProps);
        
        // Add static properties to the constructor function, if supplied.
        if (staticProps)
            _.extend(child, staticProps);
        
        // Correctly set child's `prototype.constructor`, for `instanceof`.
        child.prototype.constructor = child;
        
        // Set a convenience property in case the parent's prototype is needed later.
        child.__super__ = parent.prototype;
        
        return child;
    };
    
    // Helper function to get a URL from a Model or Collection as a property
    // or as a function.
    var getUrl = function (object) {
        if (!(object && object.url))
            throw new Error("A 'url' property or function must be specified");
        return _.isFunction(object.url) ? object.url() : object.url;
    };
    
    // Wrap an optional error callback with a fallback error event.
    var wrapError = function (onError, model, options) {
        return function (resp) {
            if (onError) {
                onError(model, resp);
            } else {
                model.trigger('error', model, resp, options);
            }
        };
    };
    
    // Helper function to escape a string for HTML rendering.
    var escapeHTML = function (string) {
        return string.replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };
    
})();
