/**
 * Created by yogev hadad on 28/03/16.
 */

window.findInObject = window.FIO = (function () {

    function Finder(options) {

        var setup = function (opt) {
            parseOptions.call(this, opt || {});
        };

        var find = function (object, arg1, arg2) {

            if (typeof object != "object") {
                log.call(this, "You can only search within an object!");
                return;
            }

            var target, options;

            switch (typeof arg1) {
                case "string" :
                    target = arg1;
                    options = arg2;
                    break;
                case "object" :
                    if (arg1.findBy) {
                        options = arg1;
                        break;
                    } else {
                        error.call(this, "Either target of 'findBy' function must be defined!");
                        return;
                    }
                default :
                    error.call(this, "Second argument must be a string or an object!");
            }

            setup.call(this, options);

            this.obj = clone(object);
            this.target = this.ignoreCase ? target.toLowerCase() : target;

            var that = this;
            var paths = [];
            var depth = -1;
            var startTime = Date.now();

            if (this.async) {
                setTimeout(function () {
                    _startSrearch();
                }, 0);
            } else {
                _startSrearch();
            }

            function _startSrearch() {
                log.call(that, "Searching for " + target + " in " + this.name + "...");
                _findInChild.call(that, that.obj);
                if (that.breakOnMaxResults) {
                    log.call(that, "Maximum number of results found");
                }
                that.done.call(this, paths.sort(that.sortBy), Date.now() - startTime);
            }

            function _findInChild(obj, path) {
                depth++;
                var path = path || this.name;

                if (this.maxResults && paths.length == this.maxResults) {
                    this.breakOnMaxResults = true;
                    return;
                }

                if (depth < this.maxDepth) {
                    if (Array.isArray(obj)) {
                        for (var i = 0; i < obj.length; i++) {
                            if (this.customFind) {
                                _checkForMatch.call(this, i, obj, path);
                            }
                            _findInChild.call(this, obj[i], path + "[" + i + "]");
                        }
                    } else if (typeof obj == "object") {
                        for (var p in obj) {
                            _checkForMatch.call(this, p, obj, path);
                            _findInChild.call(this, obj[p], path + "." + p);
                        }
                    }
                }

                depth--;
            };

            function _checkForMatch(p, obj, path) {

                if (this.filter(p)) {
                    return true; //true as in nothing to be found here
                }

                if (this.check.call(this, p, obj[p])) {
                    var result = {
                        path: path + "." + p,
                        depth: depth
                    };

                    if (this.values) {
                        result.value = obj[p];
                    }

                    if (this.print) {
                        log.call(that, " \u2022 " + result.path + (this.values ? " > " + obj[p] : ""));
                    }

                    paths.push(result);

                    return true;
                }
            }
        };

        var findValue = function(object, target, options) {
            options = options || {};
            options.findBy = function(elem, value) {
                return target == value;
            };
            find.call(this, object, target, options);
        };

        setup(options);
        return {
            setup: setup,
            find: find,
            findValue: findValue
        };
    }

    function parseOptions(options) {

        var DEFAULT_DEPTH = 5;
        var MAX_DEPTH = 10;
        var MAX_RESULTS = 10;

        var that = this;

        this.maxDepth = !isNaN(options.depth) ? Math.min(options.depth, MAX_DEPTH) : DEFAULT_DEPTH;
        this.maxResults = (function(){
            if (!isNaN(options.max)) {
                if (options.max == 0) {
                    return null;
                }
                return options.max;
            }
            return MAX_RESULTS;
        }());
        //The name of the object we search in
        this.name = options.name || "[object]";
        this.ignoreCase = options.ignoreCase;
        //Should search in Dom element
        //TODO: add DOM elements support
        //this.includeDom = options.includeDom;
        //Print each path as it is found
        this.print = options.values == false ? false : true;
        //Should the value be included in the results
        this.values = options.values == false ? false : true;
        //Shuold the match of the whole word
        this.match = options.match == false ? false : true;
        this.log =  options.log == false ? false : true;
        this.async = options.async == false ? false : true;

        //Matching function
        this.check = (function(){
            if (typeof options.findBy == "function") {
                that.customFind = true;
                return function(elem, val) {
                    try {
                        return options.findBy(elem, val);
                    } catch (e) {
                        error.call(that, e);
                    }
                };
            } else {
                return function(elem) {
                    var elemName = that.ignoreCase ? elem.toLowerCase() : elem + "";
                    return elemName == that.target || (!that.match && elemName.indexOf(that.target) != -1);
                }
            }
        }());

        //Filter function
        this.filter = function(p) {
            //var domFilter = !that.includeDom && isDomElement(p);
            var userFilter = (function(){
                if (typeof options.filter == "function") {
                    try {
                        return options.filter(p);
                    } catch (e) {
                        error.call(that, "Filter function error: ", e);
                    }
                }
            }());

            //return domFilter || userFilter;
            return userFilter;
        }

        //Sorting the results. Default: by depth
        this.sortBy = (function () {
            if (typeof options.sortBy == "function") {
                return function (a, b) {
                    try {
                        options.sortBy(a, b);
                    } catch (e) {
                        error.call(that, "Sorting function error: " + e);
                    }
                };
            } else {
                return function (a, b) {
                    return a.depth > b.depth;
                };
            }
        }());

        //Function to be called when the search has finished
        this.done = (function () {
            if (typeof options.done == "function") {
                return function (paths, ms) {
                    try {
                        options.done(paths, ms);
                    } catch (e) {
                        error.call(that, "Done callback error: " + e);
                    }
                };
            } else {
                return function (paths, ms) {
                    if (paths.length > 0) {
                        log.call(that, paths.length + " paths found: (in " + ms + "ms)", paths);
                    } else {
                        log.call(that, "Could not find " + that.target + " in " + that.name + ". (Search depth: " + that.maxDepth + ")");
                        if (that.maxDepth < MAX_DEPTH) {
                            log.call(that, "Tip: You can try increasing your search depth up to " + MAX_DEPTH);
                        }
                    }
                };
            }
        }());
    }

    //function isDomElement(elem) {
    //    var type = elem.nodeType;
    //
    //    return [1, 2, 3, 8].indexOf(type) != -1;
    //}

    //PRINTING FUNCTIONS
    function error() {
        print.call(this, "error", arguments);
    }

    function log() {
        print.call(this, "log", arguments);
    }

    function print(method, output) {
        if (!this.log) {
            return;
        }
        var output = ["FIO: "].concat(Array.prototype.slice.apply(output));
        console[method].apply(console, output);
    }

    function clone(obj) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
        }
        return copy;
    }

    return function (object, target, options) {

        var finder = new Finder(options);

        if (object && target) {
            finder.find(object, target);
        }
        return finder;
    };

}());