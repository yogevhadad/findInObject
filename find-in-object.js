/**
 * Created by yogev hadad on 28/03/16.
 */

window.findInObject = (function () {

    function parseOptions(options) {

        var DEFAULT_MAX_depth = 10;

        return {
            ignoreCase: options.ignoreCase,
            skipDom: options.skipDom,
            sortBy: (function(){
                if (typeof options.sortBy == "function") {
                    return function(a, b) {
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
            }()),
            name: options.name || "[object]",
            maxdepth: (function () {
                if (options.depth && !isNaN(options.depth)) {
                    return Math.min(options.depth, DEFAULT_MAX_depth);
                }
                return DEFAULT_MAX_depth;
            }()),
            showValue: options.showValue == false ? false : true,
            exactMatch: options.exactMatch == false ? false : true
        };
    }

    function find(obj, target, opt) {

        var depth = -1;
        var paths = [];

        findInChild(obj, target);
        return paths;

        function findInChild(obj, path) {
            depth++;
            var path = path || opt.name;

            if (depth < opt.maxdepth) {
                if (Array.isArray(obj)) {
                    for (var i = 0; i < obj.length; i++) {
                        findInChild(obj[i], path + "[" + i + "]");
                    }
                } else if (typeof obj == "object") {
                    for (var p in obj) {

                        if (opt.skipDom && isDomElement(p)) {
                            return;
                        }

                        var pName = opt.ignoreCase ? p.toLowerCase() : p + "";

                        //BINGO!!!
                        if (pName == target || (!opt.exactMatch && pName.indexOf(target) != -1)) {
                            var result = {
                                path: path + "." + p,
                                depth: depth
                            };
                            if (opt.showValue) {
                                result.value = obj[p];
                            }
                            paths.push(result);
                        }

                        findInChild(obj[p], path + "." + p);
                    }
                }
            }

            depth--;
        }
    }

    function isDomElement (elem) {
        var type = elem.nodeType;

        return [1, 2, 3, 8].indexOf(type) != -1;
    }

    return function (obj, target, options) {

        var startTime = Date.now();

        var opt = parseOptions(options || {});
        var target = opt.ignoreCase ? target.toLowerCase() : target;



        var paths = find(obj, target, opt).sort(opt.sortBy);
        if (paths.length == 0) {
            console.warn("Could not find " + target + " in " + opt.name + ". search depth: " + opt.maxdepth)
        }

        var endTIme = Date.now();
        var ms = endTIme - startTime;
        console.log("findInObject finished in " + ms + "ms");

        return paths;
    };

}());