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

'use strict';

var _prodInvariant = require('./reactProdInvariant');

var invariant = require('fbjs/lib/invariant');

function validateCallback(callback) {
  !(!callback || typeof callback === 'function') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Invalid argument passed as callback. Expected a function. Instead received: %s', callback) : _prodInvariant('187', callback) : void 0;
}

module.exports = validateCallback;