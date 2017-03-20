/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var _prodInvariant = require('./reactProdInvariant');

var invariant = require('fbjs/lib/invariant');

var viewConfigs = new Map();

var prefix = 'topsecret-';

var ReactNativeViewConfigRegistry = {
  register: function (viewConfig) {
    var name = viewConfig.uiViewClassName;
    !!viewConfigs.has(name) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Tried to register two views with the same name %s', name) : _prodInvariant('192', name) : void 0;
    var secretName = prefix + name;
    viewConfigs.set(secretName, viewConfig);
    return secretName;
  },
  get: function (secretName) {
    var config = viewConfigs.get(secretName);
    !config ? process.env.NODE_ENV !== 'production' ? invariant(false, 'View config not found for name %s', secretName) : _prodInvariant('193', secretName) : void 0;
    return config;
  }
};

module.exports = ReactNativeViewConfigRegistry;