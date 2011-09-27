//     Underscore.js 1.1.7
//     (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

/**
 *相关资料
 *中文API地址：http://wangjianjun.github.com/underscore/underscore.html
 *有注释的源代码：http://documentcloud.github.com/underscore/docs/underscore.html
 *
 *
 *
 */

(function () {
		
		// Baseline setup
		// --------------
		
		// Establish the root object, `window` in the browser, or `global` on the server.
		//创建一个根对象，也就是全局对象，这个与所在的环境有关系
		var root = this;
		
		// Save the previous value of the `_` variable.
		// 保存变量'_'先前的值
		var previousUnderscore = root._;
		
		// Establish the object that gets returned to break out of a loop iteration.
		// 建立打破一个循环迭代，得到返回的对象。
		var breaker = {};
		
		// Save bytes in the minified (but not gzipped) version:
		var ArrayProto = Array.prototype,
		ObjProto = Object.prototype,
		FuncProto = Function.prototype;
		
		// Create quick reference variables for speed access to core prototypes.
		// 创建临时变量，减少原型链上的查找
		var slice = ArrayProto.slice,
		unshift = ArrayProto.unshift,
		toString = ObjProto.toString,
		hasOwnProperty = ObjProto.hasOwnProperty;
		
		// All **ECMAScript 5** native function implementations that we hope to use are declared here.
		// ES5已经实现的，声明如下：
		var
		nativeForEach = ArrayProto.forEach,
		nativeMap = ArrayProto.map,
		nativeReduce = ArrayProto.reduce,
		nativeReduceRight = ArrayProto.reduceRight,
		nativeFilter = ArrayProto.filter,
		nativeEvery = ArrayProto.every,
		nativeSome = ArrayProto.some,
		nativeIndexOf = ArrayProto.indexOf,
		nativeLastIndexOf = ArrayProto.lastIndexOf,
		nativeIsArray = Array.isArray,
		nativeKeys = Object.keys,
		nativeBind = FuncProto.bind;
		
		// Create a safe reference to the Underscore object for use below.
		// 创建underscore对象
		var _ = function (obj) {
			return new wrapper(obj);
		};
		
		// Export the Underscore object for **CommonJS**, with backwards-compatibility
		// for the old `require()` API. If we're not in CommonJS, add `_` to the
		// global object.
		// 对外提供的API
		
		// 如果遵守 CommonJS 规范
		if (typeof module !== 'undefined' && module.exports) {
			module.exports = _;
			//下面这一行看着真诡异啊
			_._ = _;
		} else {
			// Exported as a string, for Closure Compiler "advanced" mode.
			//反之
			root['_'] = _;
		}
		
		// Current version.
		_.VERSION = '1.1.7';
		
		// Collection Functions
		//函授集合
		// --------------------
		
		// The cornerstone, an `each` implementation, aka `forEach`.
		// Handles objects with the built-in `forEach`, arrays, and raw objects.
		// Delegates to **ECMAScript 5**'s native `forEach` if available.
		
		
		// hasOwnProperty :如果 object 具有指定名称的属性，那么方法返回 true；反之则返回 false。
		// 此方法无法检查该对象的原型链中是否具有该属性；该属性必须是对象本身的一个成员。
		// in: 操作检查对象中是否有名为 property 的属性。也可以检查对象的原型，判断该属性是否为原型链的一部分。
		
		
		// each_.each(list, iterator, [context]) 别名: forEach
		//迭代list中的所有元素，按顺序用迭代器输出每个元素。
		//如果传递了context参数，则把iterator绑定到context对象上。
		//每次调用iterator都会传递三个参数：(element, index, list)。如果list是个JavaScript对象，iterator的参数是 (value, key, list))。
		//存在原生的forEach方法，Underscore就委托给forEach。
		var each = _.each = _.forEach = function (obj, iterator, context) {
			if (obj == null)
				return;
			if (nativeForEach && obj.forEach === nativeForEach) {
				// 如果ES5支持
				obj.forEach(iterator, context);
			} else if (obj.length === +obj.length) {
				
				// obj.length === +obj.length 什么意思啊？
				for (var i = 0, l = obj.length; i < l; i++) {
					if (i in obj && iterator.call(context, obj[i], i, obj) === breaker)
						return;
				}
			} else {
				for (var key in obj) {
					if (hasOwnProperty.call(obj, key)) {
						if (iterator.call(context, obj[key], key, obj) === breaker)
							return;
					}
				}
			}
		};
		
		// Return the results of applying the iterator to each element.
		// Delegates to **ECMAScript 5**'s native `map` if available.
		
		//map_.map(list, iterator, [context]) 
		//用转换函数把list中的每个值映射到一个新的数组。
		//存在原生的map方法，就用原生map方法代替。
		//如果list是个JavaScript对象，iterator的参数是(value, key, list)。
		//eg:_.map([1, 2, 3], function(num){ return num * 3; }); => [3, 6, 9]
		_.map = function (obj, iterator, context) {
			var results = [];
			if (obj == null)
				return results;
			if (nativeMap && obj.map === nativeMap)
				return obj.map(iterator, context);
			each(obj, function (value, index, list) {
					results[results.length] = iterator.call(context, value, index, list);
				});
			return results;
		};
		
		// **Reduce** builds up a single result from a list of values, aka `inject`,
		// or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
		
		// reduce_.reduce(list, iterator, memo, [context]) Aliases: inject, foldl 
		// reduce方法把列表中元素归结为一个简单的数值，reduce的别名为inject and foldl。Memo是reduce函数的初始值，reduce的每一步都需要由iterator返回。
		//eg: var sum = _.reduce([1, 2, 3], function(memo, num){ return memo + num; }, 0);=> 6
		_.reduce = _.foldl = _.inject = function (obj, iterator, memo, context) {
			var initial = memo !== void 0;
			if (obj == null)
				obj = [];
			if (nativeReduce && obj.reduce === nativeReduce) {
				if (context)
					iterator = _.bind(iterator, context);
				return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
			}
			each(obj, function (value, index, list) {
					if (!initial) {
						memo = value;
						initial = true;
					} else {
						memo = iterator.call(context, memo, value, index, list);
					}
				});
			if (!initial)
				throw new TypeError("Reduce of empty array with no initial value");
			return memo;
		};
		
		// The right-associative version of reduce, also known as `foldr`.
		// Delegates to **ECMAScript 5**'s native `reduceRight` if available.
		
		// reduceRight_.reduceRight(list, iterator, memo, [context]) Alias: foldr 
		// reducRight是从右侧开始组合的元素的reduce函数，如果存在JavaScript 1.8版本的reduceRight，则用其代替。
		// Foldr在javascript中不像其它有懒计算的语言那么有用（lazy evaluation：一种求值策略，只有当表达式的值真正需要时才对表达式进行计算）。
		_.reduceRight = _.foldr = function (obj, iterator, memo, context) {
			if (obj == null)
				obj = [];
			if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
				if (context)
					iterator = _.bind(iterator, context);
				return memo !== void 0 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
			}
			var reversed = (_.isArray(obj) ? obj.slice() : _.toArray(obj)).reverse();
			return _.reduce(reversed, iterator, memo, context);
		};
		
		// Return the first value which passes a truth test. Aliased as `detect`.
		// detect_.detect(list, iterator, [context]) 
		// 遍历list，返回第一个通过iterator真值检测的元素值。如果找到匹配的元素立即返回，不会遍历整个list。
		_.find = _.detect = function (obj, iterator, context) {
			var result;
			any(obj, function (value, index, list) {
					if (iterator.call(context, value, index, list)) {
						result = value;
						return true;
					}
				});
			return result;
		};
		
		// Return all the elements that pass a truth test.
		// Delegates to **ECMAScript 5**'s native `filter` if available.
		// Aliased as `select`.
		
		// select_.select(list, iterator, [context]) Alias: filter 
		// 遍历list，返回包含所有通过iterator真值检测的元素值。如果存在原生filter方法，则委托给filter。
		//var evens = _.select([1, 2, 3, 4, 5, 6], function(num){ return num % 2 == 0; });=> [2, 4, 6]
		_.filter = _.select = function (obj, iterator, context) {
			var results = [];
			if (obj == null)
				return results;
			if (nativeFilter && obj.filter === nativeFilter)
				return obj.filter(iterator, context);
			each(obj, function (value, index, list) {
					if (iterator.call(context, value, index, list))
						results[results.length] = value;
				});
			return results;
		};
		
		// Return all the elements for which a truth test fails.
		
		// reject_.reject(list, iterator, [context]) 
		// 返回那么没有通过iterator真值检测的元素数组，select的相反函数。
		// var odds = _.reject([1, 2, 3, 4, 5, 6], function(num){ return num % 2 == 0; });=> [1, 3, 5]
		_.reject = function (obj, iterator, context) {
			var results = [];
			if (obj == null)
				return results;
			each(obj, function (value, index, list) {
					if (!iterator.call(context, value, index, list))
						results[results.length] = value;
				});
			return results;
		};
		
		// Determine whether all of the elements match a truth test.
		// Delegates to **ECMAScript 5**'s native `every` if available.
		// Aliased as `all`.
		
		//all_.all(list, iterator, [context]) Alias: every 
		// 如果list中的所有元素都通过iterator的真值检测就返回true。如果存在原生的every方法，则委托给every。
		// _.all([true, 1, null, 'yes'], _.identity);=> false
		_.every = _.all = function (obj, iterator, context) {
			var result = true;
			if (obj == null)
				return result;
			if (nativeEvery && obj.every === nativeEvery)
				return obj.every(iterator, context);
			each(obj, function (value, index, list) {
					if (!(result = result && iterator.call(context, value, index, list)))
						return breaker;
				});
			return result;
		};
		
		// Determine if at least one element in the object matches a truth test.
		// Delegates to **ECMAScript 5**'s native `some` if available.
		// Aliased as `any`.
		
		// any_.any(list, [iterator], [context]) Alias: some 
		// 如果有任何一个元素通过通过 iterator 的真值检测就返回true。如果存在原生的some方法，则委托给some
		//_.any([null, 0, 'yes', false]);=> true
		var any = _.some = _.any = function (obj, iterator, context) {
			iterator = iterator || _.identity;
			var result = false;
			if (obj == null)
				return result;
			if (nativeSome && obj.some === nativeSome)
				return obj.some(iterator, context);
			each(obj, function (value, index, list) {
					if (result |= iterator.call(context, value, index, list))
						return breaker;
				});
			return !!result;
		};
		
		// Determine if a given value is included in the array or object using `===`.
		// Aliased as `contains`.
		
		//include_.include(list, value) Alias: contains 
		// 如果list包含指定的value则返回true，使用===检测是否相等。如果list 是数组，内部使用indexOf判断。
		// _.include([1, 2, 3], 3);=> true
		
		_.include = _.contains = function (obj, target) {
			var found = false;
			if (obj == null)
				return found;
			if (nativeIndexOf && obj.indexOf === nativeIndexOf)
				return obj.indexOf(target) != -1;
			any(obj, function (value) {
					if (found = value === target)
						return true;
				});
			return found;
		};
		
		// Invoke a method (with arguments) on every item in a collection.
		
		// invoke_.invoke(list, methodName, [*arguments]) 
		// 在list的每个元素上执行methodName方法。任何传递给invoke的额外参数，invoke都会在调用methodName方法的时候传递给它。
		// _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');=> [[1, 5, 7], [1, 2, 3]]
		_.invoke = function (obj, method) {
			var args = slice.call(arguments, 2);
			return _.map(obj, function (value) {
					return (method.call ? method || value : value[method]).apply(value, args);
				});
		};
		
		// Convenience version of a common use case of `map`: fetching a property.
		
		// pluck_.pluck(list, propertyName) 
		// pluck是map最常使用的用例模型的版本，即萃取对象数组中某属性值，返回一个数组
		// var stooges = [{name : 'moe', age : 40}, {name : 'larry', age : 50}, {name : 'curly', age : 60}];
		// _.pluck(stooges, 'name');=> ["moe", "larry", "curly"]
		_.pluck = function (obj, key) {
			return _.map(obj, function (value) {
					return value[key];
				});
		};
		
		// Return the maximum element or (element-based computation).
		
		// max_.max(list, [iterator], [context]) 
		// 返回list中的最大值。如果传递iterator参数，iterator将作为list排序的依据。
		// var stooges = [{name : 'moe', age : 40}, {name : 'larry', age : 50}, {name : 'curly', age : 60}];
		// _.max(stooges, function(stooge){ return stooge.age; });=> {name : 'curly', age : 60};

		_.max = function (obj, iterator, context) {
			if (!iterator && _.isArray(obj))
				return Math.max.apply(Math, obj);
			var result = {
				computed : -Infinity
			};
			each(obj, function (value, index, list) {
					var computed = iterator ? iterator.call(context, value, index, list) : value;
					computed >= result.computed && (result = {
							value : value,
							computed : computed
						});
				});
			return result.value;
		};
		
		// Return the minimum element (or element-based computation).
		
		// min_.min(list, [iterator], [context]) 
		// 返回list中的最小值。如果传递iterator参数，iterator将作为list排序的依据。
		// var numbers = [10, 5, 100, 2, 1000];
		// _.min(numbers);=> 2
		_.min = function (obj, iterator, context) {
			if (!iterator && _.isArray(obj))
				return Math.min.apply(Math, obj);
			var result = {
				computed : Infinity
			};
			each(obj, function (value, index, list) {
					var computed = iterator ? iterator.call(context, value, index, list) : value;
					computed < result.computed && (result = {
							value : value,
							computed : computed
						});
				});
			return result.value;
		};
		
		// Sort the object's values by a criterion produced by an iterator.
		
		// sortBy_.sortBy(list, iterator, [context]) 
		// 返回一个排序后的list。如果有iterator参数，iterator将作为list排序的依据。
		// _.sortBy([1, 2, 3, 4, 5, 6], function(num){ return Math.sin(num); });=> [5, 4, 6, 3, 1, 2]
		_.sortBy = function (obj, iterator, context) {
			return _.pluck(_.map(obj, function (value, index, list) {
						return {
							value : value,
							criteria : iterator.call(context, value, index, list)
						};
					}).sort(function (left, right) {
						var a = left.criteria,
						b = right.criteria;
						return a < b ? -1 : a > b ? 1 : 0;
					}), 'value');
		};
		
		// Groups the object's values by a criterion produced by an iterator
		
		// groupBy_.groupBy(list, iterator) 
		// 把一个集合分组为多个集合，iterator为分组条件的迭代器
		 // _.groupBy([1.3, 2.1, 2.4], function(num){ return Math.floor(num); });=> {1: [1.3], 2: [2.1, 2.4]}
		_.groupBy = function (obj, iterator) {
			var result = {};
			each(obj, function (value, index) {
					var key = iterator(value, index);
					(result[key] || (result[key] = [])).push(value);
				});
			return result;
		};
		
		// Use a comparator function to figure out at what index an object should
		// be inserted so as to maintain order. Uses binary search.
		
		// sortedIndex_.sortedIndex(list, value, [iterator]) 
		// 使用二分查找确定value在list中的位置序号，value按此序号插入能保持list原有的排序。如果传递iterator参数，iterator将作为list排序的依据 
		//Uses a binary search to determine the index at which the value should be inserted into the list in order to maintain the list's sorted order. 
		//If an iterator is passed, it will be used to compute the sort ranking of each value.
		// _.sortedIndex([10, 20, 30, 40, 50], 35);=> 3
		_.sortedIndex = function (array, obj, iterator) {
			iterator || (iterator = _.identity);
			var low = 0,
			high = array.length;
			while (low < high) {
				var mid = (low + high) >> 1;
				iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
			}
			return low;
		};
		
		// Safely convert anything iterable into a real, live array.
		
		// toArray_.toArray(list) 
		// 把list(任何可以迭代的对象)转换成一个Array，有助于arguments对象的转换。
		// (function(){ return _.toArray(arguments).slice(0); })(1, 2, 3);=> [1, 2, 3]
		_.toArray = function (iterable) {
			if (!iterable)
				return [];
			if (iterable.toArray)
				return iterable.toArray();
			if (_.isArray(iterable))
				return slice.call(iterable);
			if (_.isArguments(iterable))
				return slice.call(iterable);
			return _.values(iterable);
		};
		
		// Return the number of elements in an object.
		
		// size_.size(list) 
		// 返回list的长度。 
		// _.size({one : 1, two : 2, three : 3});=> 3
		_.size = function (obj) {
			return _.toArray(obj).length;
		};
		
		// Array Functions
		// ---------------
		
		// Get the first element of an array. Passing **n** will return the first N
		// values in the array. Aliased as `head`. The **guard** check allows it to work
		// with `_.map`.
		_.first = _.head = function (array, n, guard) {
			return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
		};
		
		// Returns everything but the first entry of the array. Aliased as `tail`.
		// Especially useful on the arguments object. Passing an **index** will return
		// the rest of the values in the array from that index onward. The **guard**
		// check allows it to work with `_.map`.
		_.rest = _.tail = function (array, index, guard) {
			return slice.call(array, (index == null) || guard ? 1 : index);
		};
		
		// Get the last element of an array.
		_.last = function (array) {
			return array[array.length - 1];
		};
		
		// Trim out all falsy values from an array.
		_.compact = function (array) {
			return _.filter(array, function (value) {
					return !!value;
				});
		};
		
		// Return a completely flattened version of an array.
		_.flatten = function (array) {
			return _.reduce(array, function (memo, value) {
					if (_.isArray(value))
						return memo.concat(_.flatten(value));
					memo[memo.length] = value;
					return memo;
				}, []);
		};
		
		// Return a version of the array that does not contain the specified value(s).
		_.without = function (array) {
			return _.difference(array, slice.call(arguments, 1));
		};
		
		// Produce a duplicate-free version of the array. If the array has already
		// been sorted, you have the option of using a faster algorithm.
		// Aliased as `unique`.
		_.uniq = _.unique = function (array, isSorted) {
			return _.reduce(array, function (memo, el, i) {
					if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el)))
						memo[memo.length] = el;
					return memo;
				}, []);
		};
		
		// Produce an array that contains the union: each distinct element from all of
		// the passed-in arrays.
		_.union = function () {
			return _.uniq(_.flatten(arguments));
		};
		
		// Produce an array that contains every item shared between all the
		// passed-in arrays. (Aliased as "intersect" for back-compat.)
		_.intersection = _.intersect = function (array) {
			var rest = slice.call(arguments, 1);
			return _.filter(_.uniq(array), function (item) {
					return _.every(rest, function (other) {
							return _.indexOf(other, item) >= 0;
						});
				});
		};
		
		// Take the difference between one array and another.
		// Only the elements present in just the first array will remain.
		_.difference = function (array, other) {
			return _.filter(array, function (value) {
					return !_.include(other, value);
				});
		};
		
		// Zip together multiple lists into a single array -- elements that share
		// an index go together.
		_.zip = function () {
			var args = slice.call(arguments);
			var length = _.max(_.pluck(args, 'length'));
			var results = new Array(length);
			for (var i = 0; i < length; i++)
				results[i] = _.pluck(args, "" + i);
			return results;
		};
		
		// If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
		// we need this function. Return the position of the first occurrence of an
		// item in an array, or -1 if the item is not included in the array.
		// Delegates to **ECMAScript 5**'s native `indexOf` if available.
		// If the array is large and already in sort order, pass `true`
		// for **isSorted** to use binary search.
		_.indexOf = function (array, item, isSorted) {
			if (array == null)
				return -1;
			var i,
			l;
			if (isSorted) {
				i = _.sortedIndex(array, item);
				return array[i] === item ? i : -1;
			}
			if (nativeIndexOf && array.indexOf === nativeIndexOf)
				return array.indexOf(item);
			for (i = 0, l = array.length; i < l; i++)
				if (array[i] === item)
					return i;
			return -1;
		};
		
		// Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
		_.lastIndexOf = function (array, item) {
			if (array == null)
				return -1;
			if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf)
				return array.lastIndexOf(item);
			var i = array.length;
			while (i--)
				if (array[i] === item)
					return i;
			return -1;
		};
		
		// Generate an integer Array containing an arithmetic progression. A port of
		// the native Python `range()` function. See
		// [the Python documentation](http://docs.python.org/library/functions.html#range).
		_.range = function (start, stop, step) {
			if (arguments.length <= 1) {
				stop = start || 0;
				start = 0;
			}
			step = arguments[2] || 1;
			
			var len = Math.max(Math.ceil((stop - start) / step), 0);
			var idx = 0;
			var range = new Array(len);
			while (idx < len) {
				range[idx++] = start;
				start += step;
			}
			
			return range;
		};
		
		// Function (ahem) Functions
		// ------------------
		
		// Create a function bound to a given object (assigning `this`, and arguments,
		// optionally). Binding with arguments is also known as `curry`.
		// Delegates to **ECMAScript 5**'s native `Function.bind` if available.
		// We check for `func.bind` first, to fail fast when `func` is undefined.
		_.bind = function (func, obj) {
			if (func.bind === nativeBind && nativeBind)
				return nativeBind.apply(func, slice.call(arguments, 1));
			var args = slice.call(arguments, 2);
			return function () {
				return func.apply(obj, args.concat(slice.call(arguments)));
			};
		};
		
		// Bind all of an object's methods to that object. Useful for ensuring that
		// all callbacks defined on an object belong to it.
		_.bindAll = function (obj) {
			var funcs = slice.call(arguments, 1);
			if (funcs.length == 0)
				funcs = _.functions(obj);
			each(funcs, function (f) {
					obj[f] = _.bind(obj[f], obj);
				});
			return obj;
		};
		
		// Memoize an expensive function by storing its results.
		_.memoize = function (func, hasher) {
			var memo = {};
			hasher || (hasher = _.identity);
			return function () {
				var key = hasher.apply(this, arguments);
				return hasOwnProperty.call(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
			};
		};
		
		// Delays a function for the given number of milliseconds, and then calls
		// it with the arguments supplied.
		_.delay = function (func, wait) {
			var args = slice.call(arguments, 2);
			return setTimeout(function () {
					return func.apply(func, args);
				}, wait);
		};
		
		// Defers a function, scheduling it to run after the current call stack has
		// cleared.
		_.defer = function (func) {
			return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
		};
		
		// Internal function used to implement `_.throttle` and `_.debounce`.
		var limit = function (func, wait, debounce) {
			var timeout;
			return function () {
				var context = this,
				args = arguments;
				var throttler = function () {
					timeout = null;
					func.apply(context, args);
				};
				if (debounce)
					clearTimeout(timeout);
				if (debounce || !timeout)
					timeout = setTimeout(throttler, wait);
			};
		};
		
		// Returns a function, that, when invoked, will only be triggered at most once
		// during a given window of time.
		_.throttle = function (func, wait) {
			return limit(func, wait, false);
		};
		
		// Returns a function, that, as long as it continues to be invoked, will not
		// be triggered. The function will be called after it stops being called for
		// N milliseconds.
		_.debounce = function (func, wait) {
			return limit(func, wait, true);
		};
		
		// Returns a function that will be executed at most one time, no matter how
		// often you call it. Useful for lazy initialization.
		_.once = function (func) {
			var ran = false,
			memo;
			return function () {
				if (ran)
					return memo;
				ran = true;
				return memo = func.apply(this, arguments);
			};
		};
		
		// Returns the first function passed as an argument to the second,
		// allowing you to adjust arguments, run code before and after, and
		// conditionally execute the original function.
		_.wrap = function (func, wrapper) {
			return function () {
				var args = [func].concat(slice.call(arguments));
				return wrapper.apply(this, args);
			};
		};
		
		// Returns a function that is the composition of a list of functions, each
		// consuming the return value of the function that follows.
		_.compose = function () {
			var funcs = slice.call(arguments);
			return function () {
				var args = slice.call(arguments);
				for (var i = funcs.length - 1; i >= 0; i--) {
					args = [funcs[i].apply(this, args)];
				}
				return args[0];
			};
		};
		
		// Returns a function that will only be executed after being called N times.
		_.after = function (times, func) {
			return function () {
				if (--times < 1) {
					return func.apply(this, arguments);
				}
			};
		};
		
		// Object Functions
		// ----------------
		
		// Retrieve the names of an object's properties.
		// Delegates to **ECMAScript 5**'s native `Object.keys`
		_.keys = nativeKeys || function (obj) {
			if (obj !== Object(obj))
				throw new TypeError('Invalid object');
			var keys = [];
			for (var key in obj)
				if (hasOwnProperty.call(obj, key))
					keys[keys.length] = key;
			return keys;
		};
		
		// Retrieve the values of an object's properties.
		_.values = function (obj) {
			return _.map(obj, _.identity);
		};
		
		// Return a sorted list of the function names available on the object.
		// Aliased as `methods`
		_.functions = _.methods = function (obj) {
			var names = [];
			for (var key in obj) {
				if (_.isFunction(obj[key]))
					names.push(key);
			}
			return names.sort();
		};
		
		// Extend a given object with all the properties in passed-in object(s).
		_.extend = function (obj) {
			each(slice.call(arguments, 1), function (source) {
					for (var prop in source) {
						if (source[prop] !== void 0)
							obj[prop] = source[prop];
					}
				});
			return obj;
		};
		
		// Fill in a given object with default properties.
		_.defaults = function (obj) {
			each(slice.call(arguments, 1), function (source) {
					for (var prop in source) {
						if (obj[prop] == null)
							obj[prop] = source[prop];
					}
				});
			return obj;
		};
		
		// Create a (shallow-cloned) duplicate of an object.
		_.clone = function (obj) {
			return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
		};
		
		// Invokes interceptor with the obj, and then returns obj.
		// The primary purpose of this method is to "tap into" a method chain, in
		// order to perform operations on intermediate results within the chain.
		_.tap = function (obj, interceptor) {
			interceptor(obj);
			return obj;
		};
		
		// Perform a deep comparison to check if two objects are equal.
		_.isEqual = function (a, b) {
			// Check object identity.
			if (a === b)
				return true;
			// Different types?
			var atype = typeof(a),
			btype = typeof(b);
			if (atype != btype)
				return false;
			// Basic equality test (watch out for coercions).
			if (a == b)
				return true;
			// One is falsy and the other truthy.
			if ((!a && b) || (a && !b))
				return false;
			// Unwrap any wrapped objects.
			if (a._chain)
				a = a._wrapped;
			if (b._chain)
				b = b._wrapped;
			// One of them implements an isEqual()?
			if (a.isEqual)
				return a.isEqual(b);
			if (b.isEqual)
				return b.isEqual(a);
			// Check dates' integer values.
			if (_.isDate(a) && _.isDate(b))
				return a.getTime() === b.getTime();
			// Both are NaN?
			if (_.isNaN(a) && _.isNaN(b))
				return false;
			// Compare regular expressions.
			if (_.isRegExp(a) && _.isRegExp(b))
				return a.source === b.source &&
				a.global === b.global &&
				a.ignoreCase === b.ignoreCase &&
				a.multiline === b.multiline;
			// If a is not an object by this point, we can't handle it.
			if (atype !== 'object')
				return false;
			// Check for different array lengths before comparing contents.
			if (a.length && (a.length !== b.length))
				return false;
			// Nothing else worked, deep compare the contents.
			var aKeys = _.keys(a),
			bKeys = _.keys(b);
			// Different object sizes?
			if (aKeys.length != bKeys.length)
				return false;
			// Recursive comparison of contents.
			for (var key in a)
				if (!(key in b) || !_.isEqual(a[key], b[key]))
					return false;
			return true;
		};
		
		// Is a given array or object empty?
		_.isEmpty = function (obj) {
			if (_.isArray(obj) || _.isString(obj))
				return obj.length === 0;
			for (var key in obj)
				if (hasOwnProperty.call(obj, key))
					return false;
			return true;
		};
		
		// Is a given value a DOM element?
		_.isElement = function (obj) {
			return !!(obj && obj.nodeType == 1);
		};
		
		// Is a given value an array?
		// Delegates to ECMA5's native Array.isArray
		_.isArray = nativeIsArray || function (obj) {
			return toString.call(obj) === '[object Array]';
		};
		
		// Is a given variable an object?
		_.isObject = function (obj) {
			return obj === Object(obj);
		};
		
		// Is a given variable an arguments object?
		_.isArguments = function (obj) {
			return !!(obj && hasOwnProperty.call(obj, 'callee'));
		};
		
		// Is a given value a function?
		_.isFunction = function (obj) {
			return !!(obj && obj.constructor && obj.call && obj.apply);
		};
		
		// Is a given value a string?
		_.isString = function (obj) {
			return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
		};
		
		// Is a given value a number?
		_.isNumber = function (obj) {
			return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
		};
		
		// Is the given value `NaN`? `NaN` happens to be the only value in JavaScript
		// that does not equal itself.
		_.isNaN = function (obj) {
			return obj !== obj;
		};
		
		// Is a given value a boolean?
		_.isBoolean = function (obj) {
			return obj === true || obj === false;
		};
		
		// Is a given value a date?
		_.isDate = function (obj) {
			return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
		};
		
		// Is the given value a regular expression?
		_.isRegExp = function (obj) {
			return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
		};
		
		// Is a given value equal to null?
		_.isNull = function (obj) {
			return obj === null;
		};
		
		// Is a given variable undefined?
		_.isUndefined = function (obj) {
			return obj === void 0;
		};
		
		// Utility Functions
		// -----------------
		
		// Run Underscore.js in *noConflict* mode, returning the `_` variable to its
		// previous owner. Returns a reference to the Underscore object.
		_.noConflict = function () {
			root._ = previousUnderscore;
			return this;
		};
		
		// Keep the identity function around for default iterators.
		_.identity = function (value) {
			return value;
		};
		
		// Run a function **n** times.
		_.times = function (n, iterator, context) {
			for (var i = 0; i < n; i++)
				iterator.call(context, i);
		};
		
		// Add your own custom functions to the Underscore object, ensuring that
		// they're correctly added to the OOP wrapper as well.
		_.mixin = function (obj) {
			each(_.functions(obj), function (name) {
					addToWrapper(name, _[name] = obj[name]);
				});
		};
		
		// Generate a unique integer id (unique within the entire client session).
		// Useful for temporary DOM ids.
		var idCounter = 0;
		_.uniqueId = function (prefix) {
			var id = idCounter++;
			return prefix ? prefix + id : id;
		};
		
		// By default, Underscore uses ERB-style template delimiters, change the
		// following template settings to use alternative delimiters.
		_.templateSettings = {
			evaluate : /<%([\s\S]+?)%>/g,
			interpolate : /<%=([\s\S]+?)%>/g
		};
		
		// JavaScript micro-templating, similar to John Resig's implementation.
		// Underscore templating handles arbitrary delimiters, preserves whitespace,
		// and correctly escapes quotes within interpolated code.
		_.template = function (str, data) {
			var c = _.templateSettings;
			var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
				'with(obj||{}){__p.push(\'' +
				str.replace(/\\/g, '\\\\')
				.replace(/'/g, "\\'")
				.replace(c.interpolate, function (match, code) {
						return "'," + code.replace(/\\'/g, "'") + ",'";
					})
				.replace(c.evaluate || null, function (match, code) {
						return "');" + code.replace(/\\'/g, "'")
						.replace(/[\r\n\t]/g, ' ') + "__p.push('";
					})
				.replace(/\r/g, '\\r')
				.replace(/\n/g, '\\n')
				.replace(/\t/g, '\\t')
				 + "');}return __p.join('');";
			var func = new Function('obj', tmpl);
			return data ? func(data) : func;
		};
		
		// The OOP Wrapper
		// 面向对象的包装
		// ---------------
		
		// If Underscore is called as a function, it returns a wrapped object that
		// can be used OO-style. This wrapper holds altered versions of all the
		// underscore functions. Wrapped objects may be chained.
		//如果下划线是一个函数调用，它返回一个被包装的对象，可用于面向对象的风格。
		//此包装拥有的所有更改的版本，强调功能。包装的物件可以链接。
		var wrapper = function (obj) {
			this._wrapped = obj;
		};
		
		// Expose `wrapper.prototype` as `_.prototype`
		_.prototype = wrapper.prototype;
		
		// Helper function to continue chaining intermediate results.
		var result = function (obj, chain) {
			return chain ? _(obj).chain() : obj;
		};
		
		// A method to easily add functions to the OOP wrapper.
		var addToWrapper = function (name, func) {
			wrapper.prototype[name] = function () {
				var args = slice.call(arguments);
				unshift.call(args, this._wrapped);
				return result(func.apply(_, args), this._chain);
			};
		};
		
		// Add all of the Underscore functions to the wrapper object.
		_.mixin(_);
		
		// Add all mutator Array functions to the wrapper.
		each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (name) {
				var method = ArrayProto[name];
				wrapper.prototype[name] = function () {
					method.apply(this._wrapped, arguments);
					return result(this._wrapped, this._chain);
				};
			});
		
		// Add all accessor Array functions to the wrapper.
		each(['concat', 'join', 'slice'], function (name) {
				var method = ArrayProto[name];
				wrapper.prototype[name] = function () {
					return result(method.apply(this._wrapped, arguments), this._chain);
				};
			});
		
		// Start chaining a wrapped Underscore object.
		wrapper.prototype.chain = function () {
			this._chain = true;
			return this;
		};
		
		// Extracts the result from a wrapped and chained object.
		wrapper.prototype.value = function () {
			return this._wrapped;
		};
		
	})();
 