# findInObject
A tool to deep search in complex json objects

The script adds on the window a function called _findInObject(obj, target, options)_ .
The function takes 3 aguments:
  obj: the object to search in
  target: the target key we are searching for
  options: a list of option to pass to the function
  
Supported options are:\n
  *ignoreCase*: _Boolean_, should the search be case sensitive. _default_: false
   *exactMatch*: _Boolean_, should the search include only part of the name. (i.e "api" will find "exteranal api") _default_: true
  *skipDom*: _Boolean_, should the search skip dom elements. _default_: true
  *sortBy*: _function_, a sorting funcion for the found pathes. _default_: sort by depth of path
  *name*: _String_, the name of the object to search in. _default_: [object]
  *depth*: _int_, the maximal depth to search in the object. _default_: 10
  *showValue*: _Boolean_, should include the value of the result path. _default_: true
  
  Returns: _Array_
  The function will return an array of objects, each includes: a path to the target (_string_), the depth of the path (_int_), and the path's value (unless turned off in the options argument).
An example:

findInObject(this, "childName", {name: "myObj"});
[{
  path: myObj.names.childName,
  depth: 3,
  value: "john"
},
{
  path: myObj.people[0].children[0].childName,
  depth: 5,
  value: "emma"
},
{
  path: myObj.people[0].children[1].childName,
  depth: 5,
  value: "daniel"
}];

