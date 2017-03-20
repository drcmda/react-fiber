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

var _assign = require('object-assign'),
    _prodInvariant = require('./reactProdInvariant');

var NativeMethodsMixin = require('./NativeMethodsMixin');
var ReactFiberReconciler = require('./ReactFiberReconciler');
var ReactGenericBatching = require('./ReactGenericBatching');
var ReactNativeAttributePayload = require('./ReactNativeAttributePayload');
var ReactNativeComponentTree = require('./ReactNativeComponentTree');
var ReactNativeInjection = require('./ReactNativeInjection');
var ReactNativeTagHandles = require('./ReactNativeTagHandles');
var ReactNativeViewConfigRegistry = require('./ReactNativeViewConfigRegistry');
var ReactPortal = require('./ReactPortal');
var UIManager = require('react-native/lib/UIManager');

var deepFreezeAndThrowOnMutationInDev = require('react-native/lib/deepFreezeAndThrowOnMutationInDev');
var emptyObject = require('fbjs/lib/emptyObject');
var findNodeHandle = require('./findNodeHandle');
var invariant = require('fbjs/lib/invariant');

var _require = require('./ReactFiberDevToolsHook'),
    injectInternals = _require.injectInternals;

var precacheFiberNode = ReactNativeComponentTree.precacheFiberNode,
    uncacheFiberNode = ReactNativeComponentTree.uncacheFiberNode,
    updateFiberProps = ReactNativeComponentTree.updateFiberProps;


ReactNativeInjection.inject();

function NativeHostComponent(tag, viewConfig) {
  this._nativeTag = tag;
  this._children = [];
  this.viewConfig = viewConfig;
}
_assign(NativeHostComponent.prototype, NativeMethodsMixin);

function recursivelyUncacheFiberNode(node) {
  if (typeof node === 'number') {
    // Leaf node (eg text)
    uncacheFiberNode(node);
  } else {
    uncacheFiberNode(node._nativeTag);

    node._children.forEach(recursivelyUncacheFiberNode);
  }
}

var NativeRenderer = ReactFiberReconciler({
  appendChild: function (parentInstance, child) {
    if (typeof parentInstance === 'number') {
      // Root container
      UIManager.setChildren(parentInstance, // containerTag
      [child._nativeTag]);
    } else {
      var children = parentInstance._children;

      children.push(child);

      UIManager.manageChildren(parentInstance._nativeTag, // containerTag
      [], // moveFromIndices
      [], // moveToIndices
      [child._nativeTag], // addChildReactTags
      [children.length - 1], // addAtIndices
      []);
    }
  },
  appendInitialChild: function (parentInstance, child) {
    parentInstance._children.push(child);
  },
  commitTextUpdate: function (textInstance, oldText, newText) {
    UIManager.updateView(textInstance, // reactTag
    'RCTRawText', // viewName
    { text: newText });
  },
  commitMount: function (instance, type, newProps, internalInstanceHandle) {
    // Noop
  },
  commitUpdate: function (instance, updatePayloadTODO, type, oldProps, newProps, internalInstanceHandle) {
    var viewConfig = instance.viewConfig;

    updateFiberProps(instance._nativeTag, newProps);

    var updatePayload = ReactNativeAttributePayload.diff(oldProps, newProps, viewConfig.validAttributes);

    UIManager.updateView(instance._nativeTag, // reactTag
    viewConfig.uiViewClassName, // viewName
    updatePayload);
  },
  createInstance: function (type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
    var tag = ReactNativeTagHandles.allocateTag();
    var viewConfig = ReactNativeViewConfigRegistry.get(type);

    if (process.env.NODE_ENV !== 'production') {
      for (var key in viewConfig.validAttributes) {
        if (props.hasOwnProperty(key)) {
          deepFreezeAndThrowOnMutationInDev(props[key]);
        }
      }
    }

    var updatePayload = ReactNativeAttributePayload.create(props, viewConfig.validAttributes);

    UIManager.createView(tag, // reactTag
    viewConfig.uiViewClassName, // viewName
    rootContainerInstance, // rootTag
    updatePayload);

    var component = new NativeHostComponent(tag, viewConfig);

    precacheFiberNode(internalInstanceHandle, tag);
    updateFiberProps(tag, props);

    return component;
  },
  createTextInstance: function (text, rootContainerInstance, hostContext, internalInstanceHandle) {
    var tag = ReactNativeTagHandles.allocateTag();

    UIManager.createView(tag, // reactTag
    'RCTRawText', // viewName
    rootContainerInstance, // rootTag
    { text: text });

    precacheFiberNode(internalInstanceHandle, tag);

    return tag;
  },
  finalizeInitialChildren: function (parentInstance, type, props, rootContainerInstance) {
    // Don't send a no-op message over the bridge.
    if (parentInstance._children.length === 0) {
      return false;
    }

    // Map from child objects to native tags.
    // Either way we need to pass a copy of the Array to prevent it from being frozen.
    var nativeTags = parentInstance._children.map(function (child) {
      return typeof child === 'number' ? child // Leaf node (eg text)
      : child._nativeTag;
    });

    UIManager.setChildren(parentInstance._nativeTag, // containerTag
    nativeTags);

    return false;
  },
  getRootHostContext: function () {
    return emptyObject;
  },
  getChildHostContext: function () {
    return emptyObject;
  },
  getPublicInstance: function (instance) {
    return instance;
  },
  insertBefore: function (parentInstance, child, beforeChild) {
    // TODO (bvaughn): Remove this check when...
    // We create a wrapper object for the container in ReactNative render()
    // Or we refactor to remove wrapper objects entirely.
    // For more info on pros/cons see PR #8560 description.
    !(typeof parentInstance !== 'number') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Container does not support insertBefore operation') : _prodInvariant('191') : void 0;

    var children = parentInstance._children;

    var beforeChildIndex = children.indexOf(beforeChild);
    var index = children.indexOf(child);

    // Move existing child or add new child?
    if (index >= 0) {
      children.splice(index, 1);
      children.splice(beforeChildIndex, 0, child);

      UIManager.manageChildren(parentInstance._nativeTag, // containerID
      [index], // moveFromIndices
      [beforeChildIndex], // moveToIndices
      [], // addChildReactTags
      [], // addAtIndices
      []);
    } else {
      children.splice(beforeChildIndex, 0, child);

      UIManager.manageChildren(parentInstance._nativeTag, // containerID
      [], // moveFromIndices
      [], // moveToIndices
      [child._nativeTag], // addChildReactTags
      [beforeChildIndex], // addAtIndices
      []);
    }
  },
  prepareForCommit: function () {
    // Noop
  },
  prepareUpdate: function (instance, type, oldProps, newProps, rootContainerInstance, hostContext) {
    return emptyObject;
  },
  removeChild: function (parentInstance, child) {
    recursivelyUncacheFiberNode(child);

    if (typeof parentInstance === 'number') {
      UIManager.manageChildren(parentInstance, // containerID
      [], // moveFromIndices
      [], // moveToIndices
      [], // addChildReactTags
      [], // addAtIndices
      [0]);
    } else {
      var children = parentInstance._children;
      var index = children.indexOf(child);

      children.splice(index, 1);

      UIManager.manageChildren(parentInstance._nativeTag, // containerID
      [], // moveFromIndices
      [], // moveToIndices
      [], // addChildReactTags
      [], // addAtIndices
      [index]);
    }
  },
  resetAfterCommit: function () {
    // Noop
  },
  resetTextContent: function (instance) {
    // Noop
  },
  shouldDeprioritizeSubtree: function (type, props) {
    return false;
  },


  scheduleAnimationCallback: global.requestAnimationFrame,

  scheduleDeferredCallback: global.requestIdleCallback,

  shouldSetTextContent: function (props) {
    // TODO (bvaughn) Revisit this decision.
    // Always returning false simplifies the createInstance() implementation,
    // But creates an additional child Fiber for raw text children.
    // No additional native views are created though.
    // It's not clear to me which is better so I'm deferring for now.
    // More context @ github.com/facebook/react/pull/8560#discussion_r92111303
    return false;
  },


  useSyncScheduling: true
});

ReactGenericBatching.injection.injectFiberBatchedUpdates(NativeRenderer.batchedUpdates);

var roots = new Map();

findNodeHandle.injection.injectFindNode(function (fiber) {
  var instance = NativeRenderer.findHostInstance(fiber);
  return instance ? instance._nativeTag : null;
});
findNodeHandle.injection.injectFindRootNodeID(function (instance) {
  return instance._nativeTag;
});

var ReactNative = {
  findNodeHandle: findNodeHandle,

  render: function (element, containerTag, callback) {
    var root = roots.get(containerTag);

    if (!root) {
      // TODO (bvaughn): If we decide to keep the wrapper component,
      // We could create a wrapper for containerTag as well to reduce special casing.
      root = NativeRenderer.createContainer(containerTag);
      roots.set(containerTag, root);
    }
    NativeRenderer.updateContainer(element, root, null, callback);

    return NativeRenderer.getPublicRootInstance(root);
  },
  unmountComponentAtNode: function (containerTag) {
    var root = roots.get(containerTag);
    if (root) {
      // TODO: Is it safe to reset this now or should I wait since this unmount could be deferred?
      NativeRenderer.updateContainer(null, root, null, function () {
        roots['delete'](containerTag);
      });
    }
  },
  unmountComponentAtNodeAndRemoveContainer: function (containerTag) {
    ReactNative.unmountComponentAtNode(containerTag);

    // Call back into native to remove all of the subviews from this container
    UIManager.removeRootView(containerTag);
  },
  unstable_createPortal: function (children, containerTag) {
    var key = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    return ReactPortal.createPortal(children, containerTag, null, key);
  },


  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates
};

if (typeof injectInternals === 'function') {
  injectInternals({
    findFiberByHostInstance: ReactNativeComponentTree.getClosestInstanceFromNode,
    findHostInstanceByFiber: NativeRenderer.findHostInstance
  });
}

module.exports = ReactNative;