/**
 * Created by yogev hadad on 28/03/16.
 */

window.findInObject = window.FIO = (function () {

    function Finder() {

        var init = function (opt) {
            parseOptions.call(this, opt || {});
        };

        var find = function (object, target) {

            this.obj = copy(object);
            this.target = this.ignoreCase ? target.toLowerCase() : target;

            var that = this;
            var paths = [];
            var depth = -1;
            var startTime = Date.now();
            setTimeout(function () {
                print("Searching for " + target + " in " + this.name + "...");
                _findInChild.call(that, that.obj);
                if (that.breakOnMaxResults) {
                    print("Maximum number of results found");
                }
                that.done(paths, Date.now() - startTime);
            }, 0);

            function _findInChild (obj, path) {
                depth++;
                var path = path || this.name;

                if (this.maxResults && paths.length == this.maxResults) {
                    this.breakOnMaxResults = true;
                    return;
                }

                if (depth < this.maxDepth) {
                    if (Array.isArray(obj)) {
                        for (var i = 0; i < obj.length; i++) {
                            _findInChild.call(this, obj[i], path + "[" + i + "]");
                        }
                    } else if (typeof obj == "object") {
                        for (var p in obj) {

                            if (this.filter(p)) {
                                return;
                            }

                            var pName = this.ignoreCase ? p.toLowerCase() : p + "";

                            //BINGO!!!
                            if (pName == target || (!this.match && pName.indexOf(target) != -1)) {
                                var result = {
                                    path: path + "." + p,
                                    depth: depth
                                };

                                if (this.values) {
                                    result.value = obj[p];
                                }

                                if (this.print) {
                                    print(" \u2022 " + result.path + (this.values ? " > " + obj[p] : ""));
                                }

                                paths.push(result);
                            }

                            _findInChild.call(this, obj[p], path + "." + p);
                        }
                    }
                }

                depth--;
            };
        };

        return {
            init: init,
            find: find
        };
    }

    function parseOptions(options) {

        var DEFAULT_DEPTH = 5;
        var MAX_DEPTH = 10;
        var MAX_RESULTS = 10;

        var that = this;
        //var log = options.log == false ? false : true;

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
        //this.log = log;
        this.ignoreCase = options.ignoreCase;
        //Should search in Dom element
        //TODO: add DOM elements support
        //this.includeDom = options.includeDom;
        //Print each path as it is found
        this.print = options.print;
        //Should the value be included in the results
        this.values = options.values == false ? false : true;
        this.match = options.match == false ? false : true;

        //Filter function
        this.filter = function(p) {
            //var domFilter = !that.includeDom && isDomElement(p);
            var userFilter = (function(){
                if (typeof options.filter == "function") {
                    try {
                        return options.filter(p);
                    } catch (e) {
                        print("Filter function error: ", e);
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
                        console.error("Sorting function error: " + e);
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
                        console.error("Done callback error: " + e);
                    }
                };
            } else {
                return function (paths, ms) {
                    if (paths.length > 0) {
                        print(paths.length + " paths found: (in " + ms + "ms)", paths);
                    } else {
                        print("Could not find " + that.target + " in " + that.name + ". (Search depth: " + maxDepth + ")");
                        if (that.maxDepth < MAX_DEPTH) {
                            print("Tip: You can try increasing your search depth up to " + MAX_DEPTH);
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

    function print() {
        var args = ["FIO: "].concat(Array.prototype.slice.apply(arguments));
        console.log.apply(console, args);
    }

    function copy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    return function (object, target, options) {

        var finder = new Finder();

        if (object && target) {
            finder.init(options);
            finder.find(object, target);
        }
        return finder;
    };

}());