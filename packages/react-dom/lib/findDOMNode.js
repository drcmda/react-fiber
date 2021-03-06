'use strict';

var _prodInvariant = require('./reactProdInvariant');

/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

var ReactCurrentOwner = require('react/lib/ReactCurrentOwner');
var ReactInstanceMap = require('./ReactInstanceMap');

var getComponentName = require('./getComponentName');
var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');

var findFiber = function (arg) {
  !false ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Missing injection for fiber findDOMNode') : _prodInvariant('151') : void 0;
};
var findStack = function (arg) {
  !false ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Missing injection for stack findDOMNode') : _prodInvariant('152') : void 0;
};

var findDOMNode = function (componentOrElement) {
  if (process.env.NODE_ENV !== 'production') {
    var owner = ReactCurrentOwner.current;
    if (owner !== null) {
      var isFiber = typeof owner.tag === 'number';
      var warnedAboutRefsInRender = isFiber ? owner.stateNode._warnedAboutRefsInRender : owner._warnedAboutRefsInRender;
      process.env.NODE_ENV !== 'production' ? warning(warnedAboutRefsInRender, '%s is accessing findDOMNode inside its render(). ' + 'render() should be a pure function of props and state. It should ' + 'never access something that requires stale data from the previous ' + 'render, such as refs. Move this logic to componentDidMount and ' + 'componentDidUpdate instead.', getComponentName(owner) || 'A component') : void 0;
      if (isFiber) {
        owner.stateNode._warnedAboutRefsInRender = true;
      } else {
        owner._warnedAboutRefsInRender = true;
      }
    }
  }
  if (componentOrElement == null) {
    return null;
  }
  if (componentOrElement.nodeType === 1) {
    return componentOrElement;
  }

  var inst = ReactInstanceMap.get(componentOrElement);
  if (inst) {
    if (typeof inst.tag === 'number') {
      return findFiber(inst);
    } else {
      return findStack(inst);
    }
  }

  if (typeof componentOrElement.render === 'function') {
    !false ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Unable to find node on an unmounted component.') : _prodInvariant('153') : void 0;
  } else {
    !false ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Element appears to be neither ReactComponent nor DOMNode. Keys: %s', Object.keys(componentOrElement)) : _prodInvariant('154', Object.keys(componentOrElement)) : void 0;
  }
};

findDOMNode._injectFiber = function (fn) {
  findFiber = fn;
};
findDOMNode._injectStack = function (fn) {
  findStack = fn;
};

module.exports = findDOMNode;