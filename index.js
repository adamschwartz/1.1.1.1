// Modified from https://raw.githubusercontent.com/NYTimes/text-balancer/8e1a46e173b1775fae16bbfa7578a3999a31f3b9/text-balancer.standalone.js

const textBalancer = (function () {

    var candidates = [];

    var initialize = function (elements) {
        candidates = elements;

        balanceText();
    };

    // HELPER FUNCTION -- initializes recursive binary search
    var balanceText = function () {
        var element;
        var i;

        for (i = 0; i < candidates.length; i += 1) {
            element = candidates[i];

            if (textElementIsMultipleLines(element)) {
                element.style.maxWidth = '';
                squeezeContainer(element, element.clientHeight, 0, element.clientWidth);
            }
        }
    };

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    var debounce = function (func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    var rebalanceText = debounce(function() {
        balanceText();
    }, 100);

    window.addEventListener('resize', rebalanceText);

    // Make the headline element as narrow as possible while maintaining its current height (number of lines). Binary search.
    function squeezeContainer(headline, originalHeight, bottomRange, topRange) {
        var mid;
        if (bottomRange >= topRange) {
            headline.style.maxWidth = topRange + 'px';
            return;
        }
        mid = (bottomRange + topRange) / 2;
        headline.style.maxWidth = mid + 'px';

        if (headline.clientHeight > originalHeight) {
            // we've squoze too far and headline has spilled onto an additional line; recurse on wider range
            squeezeContainer(headline, originalHeight, mid+1, topRange);
        } else {
            // headline has not wrapped to another line; keep squeezing!
            squeezeContainer(headline, originalHeight, bottomRange+1, mid);
        }
    }

    // function to see if a headline is multiple lines
    // we only want to break if the headline is multiple lines
    //
    // We achieve this by turning the first word into a span
    // and then we compare the height of that span to the height
    // of the entire headline. If the headline is bigger than the
    // span by 10px we balance the headline.
    var textElementIsMultipleLines = function (element) {
        var firstWordHeight;
        var elementHeight;
        var HEIGHT_OFFSET;
        var elementWords;
        var firstWord;
        var ORIGINAL_ELEMENT_TEXT;

        ORIGINAL_ELEMENT_TEXT = element.innerHTML;

        // usually there is around a 5px discrepency between
        // the first word and the height of the whole headline
        // so subtract the height of the headline by 10 px and
        // we should be good
        HEIGHT_OFFSET = 10;

        // get all the words in the headline as
        // an array -- will include punctuation
        //
        // this is used to put the headline back together
        elementWords = element.innerHTML.split(' ');

        // make span for first word and give it an id
        // so we can access it in le dom
        firstWord = document.createElement('span');
        firstWord.id = 'element-first-word';
        firstWord.innerHTML = elementWords[0];

        // this is the entire headline
        // as an array except for first word
        //
        // we will append it to the headline after the span
        elementWords = elementWords.slice(1);

        // empty the headline and append the span to it
        element.innerHTML = '';
        element.appendChild(firstWord);

        // add the rest of the element back to it
        element.innerHTML += ' ' + elementWords.join(' ');

        // update the first word variable in the dom
        firstWord = document.getElementById('element-first-word');

        firstWordHeight = firstWord.offsetHeight;
        elementHeight = element.offsetHeight;
        // restore the original element text
        element.innerHTML = ORIGINAL_ELEMENT_TEXT;

        // compare the height of the element and the height of the first word
        return elementHeight - HEIGHT_OFFSET > firstWordHeight;

    } // end textElementIsMultipleLines

    return {
        initialize: initialize,
    };

})(); // end textBalancer

/* Taken from https://unpkg.com/focus-visible@4.1.5/dist/focus-visible.js */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

  /**
   * https://github.com/WICG/focus-visible
   */
  function init() {
    var hadKeyboardEvent = true;
    var hadFocusVisibleRecently = false;
    var hadFocusVisibleRecentlyTimeout = null;

    var inputTypesWhitelist = {
      text: true,
      search: true,
      url: true,
      tel: true,
      email: true,
      password: true,
      number: true,
      date: true,
      month: true,
      week: true,
      time: true,
      datetime: true,
      'datetime-local': true
    };

    /**
     * Helper function for legacy browsers and iframes which sometimes focus
     * elements like document, body, and non-interactive SVG.
     * @param {Element} el
     */
    function isValidFocusTarget(el) {
      if (
        el &&
        el !== document &&
        el.nodeName !== 'HTML' &&
        el.nodeName !== 'BODY' &&
        'classList' in el &&
        'contains' in el.classList
      ) {
        return true;
      }
      return false;
    }

    /**
     * Computes whether the given element should automatically trigger the
     * `focus-visible` class being added, i.e. whether it should always match
     * `:focus-visible` when focused.
     * @param {Element} el
     * @return {boolean}
     */
    function focusTriggersKeyboardModality(el) {
      var type = el.type;
      var tagName = el.tagName;

      if (tagName == 'INPUT' && inputTypesWhitelist[type] && !el.readOnly) {
        return true;
      }

      if (tagName == 'TEXTAREA' && !el.readOnly) {
        return true;
      }

      if (el.isContentEditable) {
        return true;
      }

      return false;
    }

    /**
     * Add the `focus-visible` class to the given element if it was not added by
     * the author.
     * @param {Element} el
     */
    function addFocusVisibleClass(el) {
      if (el.classList.contains('focus-visible')) {
        return;
      }
      el.classList.add('focus-visible');
      el.setAttribute('data-focus-visible-added', '');
    }

    /**
     * Remove the `focus-visible` class from the given element if it was not
     * originally added by the author.
     * @param {Element} el
     */
    function removeFocusVisibleClass(el) {
      if (!el.hasAttribute('data-focus-visible-added')) {
        return;
      }
      el.classList.remove('focus-visible');
      el.removeAttribute('data-focus-visible-added');
    }

    /**
     * Treat `keydown` as a signal that the user is in keyboard modality.
     * Apply `focus-visible` to any current active element and keep track
     * of our keyboard modality state with `hadKeyboardEvent`.
     * @param {Event} e
     */
    function onKeyDown(e) {
      if (isValidFocusTarget(document.activeElement)) {
        addFocusVisibleClass(document.activeElement);
      }

      hadKeyboardEvent = true;
    }

    /**
     * If at any point a user clicks with a pointing device, ensure that we change
     * the modality away from keyboard.
     * This avoids the situation where a user presses a key on an already focused
     * element, and then clicks on a different element, focusing it with a
     * pointing device, while we still think we're in keyboard modality.
     * @param {Event} e
     */
    function onPointerDown(e) {
      hadKeyboardEvent = false;
    }

    /**
     * On `focus`, add the `focus-visible` class to the target if:
     * - the target received focus as a result of keyboard navigation, or
     * - the event target is an element that will likely require interaction
     *   via the keyboard (e.g. a text box)
     * @param {Event} e
     */
    function onFocus(e) {
      // Prevent IE from focusing the document or HTML element.
      if (!isValidFocusTarget(e.target)) {
        return;
      }

      if (hadKeyboardEvent || focusTriggersKeyboardModality(e.target)) {
        addFocusVisibleClass(e.target);
      }
    }

    /**
     * On `blur`, remove the `focus-visible` class from the target.
     * @param {Event} e
     */
    function onBlur(e) {
      if (!isValidFocusTarget(e.target)) {
        return;
      }

      if (
        e.target.classList.contains('focus-visible') ||
        e.target.hasAttribute('data-focus-visible-added')
      ) {
        // To detect a tab/window switch, we look for a blur event followed
        // rapidly by a visibility change.
        // If we don't see a visibility change within 100ms, it's probably a
        // regular focus change.
        hadFocusVisibleRecently = true;
        window.clearTimeout(hadFocusVisibleRecentlyTimeout);
        hadFocusVisibleRecentlyTimeout = window.setTimeout(function() {
          hadFocusVisibleRecently = false;
          window.clearTimeout(hadFocusVisibleRecentlyTimeout);
        }, 100);
        removeFocusVisibleClass(e.target);
      }
    }

    /**
     * If the user changes tabs, keep track of whether or not the previously
     * focused element had .focus-visible.
     * @param {Event} e
     */
    function onVisibilityChange(e) {
      if (document.visibilityState == 'hidden') {
        // If the tab becomes active again, the browser will handle calling focus
        // on the element (Safari actually calls it twice).
        // If this tab change caused a blur on an element with focus-visible,
        // re-apply the class when the user switches back to the tab.
        if (hadFocusVisibleRecently) {
          hadKeyboardEvent = true;
        }
        addInitialPointerMoveListeners();
      }
    }

    /**
     * Add a group of listeners to detect usage of any pointing devices.
     * These listeners will be added when the polyfill first loads, and anytime
     * the window is blurred, so that they are active when the window regains
     * focus.
     */
    function addInitialPointerMoveListeners() {
      document.addEventListener('mousemove', onInitialPointerMove);
      document.addEventListener('mousedown', onInitialPointerMove);
      document.addEventListener('mouseup', onInitialPointerMove);
      document.addEventListener('pointermove', onInitialPointerMove);
      document.addEventListener('pointerdown', onInitialPointerMove);
      document.addEventListener('pointerup', onInitialPointerMove);
      document.addEventListener('touchmove', onInitialPointerMove);
      document.addEventListener('touchstart', onInitialPointerMove);
      document.addEventListener('touchend', onInitialPointerMove);
    }

    function removeInitialPointerMoveListeners() {
      document.removeEventListener('mousemove', onInitialPointerMove);
      document.removeEventListener('mousedown', onInitialPointerMove);
      document.removeEventListener('mouseup', onInitialPointerMove);
      document.removeEventListener('pointermove', onInitialPointerMove);
      document.removeEventListener('pointerdown', onInitialPointerMove);
      document.removeEventListener('pointerup', onInitialPointerMove);
      document.removeEventListener('touchmove', onInitialPointerMove);
      document.removeEventListener('touchstart', onInitialPointerMove);
      document.removeEventListener('touchend', onInitialPointerMove);
    }

    /**
     * When the polfyill first loads, assume the user is in keyboard modality.
     * If any event is received from a pointing device (e.g. mouse, pointer,
     * touch), turn off keyboard modality.
     * This accounts for situations where focus enters the page from the URL bar.
     * @param {Event} e
     */
    function onInitialPointerMove(e) {
      // Work around a Safari quirk that fires a mousemove on <html> whenever the
      // window blurs, even if you're tabbing out of the page. ¯\_(ツ)_/¯
      if (e.target.nodeName.toLowerCase() === 'html') {
        return;
      }

      hadKeyboardEvent = false;
      removeInitialPointerMoveListeners();
    }

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('touchstart', onPointerDown, true);
    document.addEventListener('focus', onFocus, true);
    document.addEventListener('blur', onBlur, true);
    document.addEventListener('visibilitychange', onVisibilityChange, true);
    addInitialPointerMoveListeners();

    document.body.classList.add('js-focus-visible');
  }

  /**
   * Subscription when the DOM is ready
   * @param {Function} callback
   */
  function onDOMReady(callback) {
    var loaded;

    /**
     * Callback wrapper for check loaded state
     */
    function load() {
      if (!loaded) {
        loaded = true;

        callback();
      }
    }

    if (['interactive', 'complete'].indexOf(document.readyState) >= 0) {
      callback();
    } else {
      loaded = false;
      document.addEventListener('DOMContentLoaded', load, false);
      window.addEventListener('load', load, false);
    }
  }

  if (typeof document !== 'undefined') {
    onDOMReady(init);
  }

})));

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.basicScroll = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function backInOut(t) {
  var s = 1.70158 * 1.525;
  if ((t *= 2) < 1) return 0.5 * (t * t * ((s + 1) * t - s));
  return 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2);
}

module.exports = backInOut;

},{}],2:[function(require,module,exports){
"use strict";

function backIn(t) {
  var s = 1.70158;
  return t * t * ((s + 1) * t - s);
}

module.exports = backIn;

},{}],3:[function(require,module,exports){
"use strict";

function backOut(t) {
  var s = 1.70158;
  return --t * t * ((s + 1) * t + s) + 1;
}

module.exports = backOut;

},{}],4:[function(require,module,exports){
'use strict';

var bounceOut = require('./bounce-out');

function bounceInOut(t) {
  return t < 0.5 ? 0.5 * (1.0 - bounceOut(1.0 - t * 2.0)) : 0.5 * bounceOut(t * 2.0 - 1.0) + 0.5;
}

module.exports = bounceInOut;

},{"./bounce-out":6}],5:[function(require,module,exports){
'use strict';

var bounceOut = require('./bounce-out');

function bounceIn(t) {
  return 1.0 - bounceOut(1.0 - t);
}

module.exports = bounceIn;

},{"./bounce-out":6}],6:[function(require,module,exports){
"use strict";

function bounceOut(t) {
  var a = 4.0 / 11.0;
  var b = 8.0 / 11.0;
  var c = 9.0 / 10.0;

  var ca = 4356.0 / 361.0;
  var cb = 35442.0 / 1805.0;
  var cc = 16061.0 / 1805.0;

  var t2 = t * t;

  return t < a ? 7.5625 * t2 : t < b ? 9.075 * t2 - 9.9 * t + 3.4 : t < c ? ca * t2 - cb * t + cc : 10.8 * t * t - 20.52 * t + 10.72;
}

module.exports = bounceOut;

},{}],7:[function(require,module,exports){
"use strict";

function circInOut(t) {
  if ((t *= 2) < 1) return -0.5 * (Math.sqrt(1 - t * t) - 1);
  return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
}

module.exports = circInOut;

},{}],8:[function(require,module,exports){
"use strict";

function circIn(t) {
  return 1.0 - Math.sqrt(1.0 - t * t);
}

module.exports = circIn;

},{}],9:[function(require,module,exports){
"use strict";

function circOut(t) {
  return Math.sqrt(1 - --t * t);
}

module.exports = circOut;

},{}],10:[function(require,module,exports){
"use strict";

function cubicInOut(t) {
  return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
}

module.exports = cubicInOut;

},{}],11:[function(require,module,exports){
"use strict";

function cubicIn(t) {
  return t * t * t;
}

module.exports = cubicIn;

},{}],12:[function(require,module,exports){
"use strict";

function cubicOut(t) {
  var f = t - 1.0;
  return f * f * f + 1.0;
}

module.exports = cubicOut;

},{}],13:[function(require,module,exports){
"use strict";

function elasticInOut(t) {
  return t < 0.5 ? 0.5 * Math.sin(+13.0 * Math.PI / 2 * 2.0 * t) * Math.pow(2.0, 10.0 * (2.0 * t - 1.0)) : 0.5 * Math.sin(-13.0 * Math.PI / 2 * (2.0 * t - 1.0 + 1.0)) * Math.pow(2.0, -10.0 * (2.0 * t - 1.0)) + 1.0;
}

module.exports = elasticInOut;

},{}],14:[function(require,module,exports){
"use strict";

function elasticIn(t) {
  return Math.sin(13.0 * t * Math.PI / 2) * Math.pow(2.0, 10.0 * (t - 1.0));
}

module.exports = elasticIn;

},{}],15:[function(require,module,exports){
"use strict";

function elasticOut(t) {
  return Math.sin(-13.0 * (t + 1.0) * Math.PI / 2) * Math.pow(2.0, -10.0 * t) + 1.0;
}

module.exports = elasticOut;

},{}],16:[function(require,module,exports){
"use strict";

function expoInOut(t) {
  return t === 0.0 || t === 1.0 ? t : t < 0.5 ? +0.5 * Math.pow(2.0, 20.0 * t - 10.0) : -0.5 * Math.pow(2.0, 10.0 - t * 20.0) + 1.0;
}

module.exports = expoInOut;

},{}],17:[function(require,module,exports){
"use strict";

function expoIn(t) {
  return t === 0.0 ? t : Math.pow(2.0, 10.0 * (t - 1.0));
}

module.exports = expoIn;

},{}],18:[function(require,module,exports){
"use strict";

function expoOut(t) {
  return t === 1.0 ? t : 1.0 - Math.pow(2.0, -10.0 * t);
}

module.exports = expoOut;

},{}],19:[function(require,module,exports){
'use strict';

module.exports = {
  'backInOut': require('./back-in-out'),
  'backIn': require('./back-in'),
  'backOut': require('./back-out'),
  'bounceInOut': require('./bounce-in-out'),
  'bounceIn': require('./bounce-in'),
  'bounceOut': require('./bounce-out'),
  'circInOut': require('./circ-in-out'),
  'circIn': require('./circ-in'),
  'circOut': require('./circ-out'),
  'cubicInOut': require('./cubic-in-out'),
  'cubicIn': require('./cubic-in'),
  'cubicOut': require('./cubic-out'),
  'elasticInOut': require('./elastic-in-out'),
  'elasticIn': require('./elastic-in'),
  'elasticOut': require('./elastic-out'),
  'expoInOut': require('./expo-in-out'),
  'expoIn': require('./expo-in'),
  'expoOut': require('./expo-out'),
  'linear': require('./linear'),
  'quadInOut': require('./quad-in-out'),
  'quadIn': require('./quad-in'),
  'quadOut': require('./quad-out'),
  'quartInOut': require('./quart-in-out'),
  'quartIn': require('./quart-in'),
  'quartOut': require('./quart-out'),
  'quintInOut': require('./quint-in-out'),
  'quintIn': require('./quint-in'),
  'quintOut': require('./quint-out'),
  'sineInOut': require('./sine-in-out'),
  'sineIn': require('./sine-in'),
  'sineOut': require('./sine-out')
};

},{"./back-in":2,"./back-in-out":1,"./back-out":3,"./bounce-in":5,"./bounce-in-out":4,"./bounce-out":6,"./circ-in":8,"./circ-in-out":7,"./circ-out":9,"./cubic-in":11,"./cubic-in-out":10,"./cubic-out":12,"./elastic-in":14,"./elastic-in-out":13,"./elastic-out":15,"./expo-in":17,"./expo-in-out":16,"./expo-out":18,"./linear":20,"./quad-in":22,"./quad-in-out":21,"./quad-out":23,"./quart-in":25,"./quart-in-out":24,"./quart-out":26,"./quint-in":28,"./quint-in-out":27,"./quint-out":29,"./sine-in":31,"./sine-in-out":30,"./sine-out":32}],20:[function(require,module,exports){
"use strict";

function linear(t) {
  return t;
}

module.exports = linear;

},{}],21:[function(require,module,exports){
"use strict";

function quadInOut(t) {
    t /= 0.5;
    if (t < 1) return 0.5 * t * t;
    t--;
    return -0.5 * (t * (t - 2) - 1);
}

module.exports = quadInOut;

},{}],22:[function(require,module,exports){
"use strict";

function quadIn(t) {
  return t * t;
}

module.exports = quadIn;

},{}],23:[function(require,module,exports){
"use strict";

function quadOut(t) {
  return -t * (t - 2.0);
}

module.exports = quadOut;

},{}],24:[function(require,module,exports){
"use strict";

function quarticInOut(t) {
  return t < 0.5 ? +8.0 * Math.pow(t, 4.0) : -8.0 * Math.pow(t - 1.0, 4.0) + 1.0;
}

module.exports = quarticInOut;

},{}],25:[function(require,module,exports){
"use strict";

function quarticIn(t) {
  return Math.pow(t, 4.0);
}

module.exports = quarticIn;

},{}],26:[function(require,module,exports){
"use strict";

function quarticOut(t) {
  return Math.pow(t - 1.0, 3.0) * (1.0 - t) + 1.0;
}

module.exports = quarticOut;

},{}],27:[function(require,module,exports){
"use strict";

function qinticInOut(t) {
    if ((t *= 2) < 1) return 0.5 * t * t * t * t * t;
    return 0.5 * ((t -= 2) * t * t * t * t + 2);
}

module.exports = qinticInOut;

},{}],28:[function(require,module,exports){
"use strict";

function qinticIn(t) {
  return t * t * t * t * t;
}

module.exports = qinticIn;

},{}],29:[function(require,module,exports){
"use strict";

function qinticOut(t) {
  return --t * t * t * t * t + 1;
}

module.exports = qinticOut;

},{}],30:[function(require,module,exports){
"use strict";

function sineInOut(t) {
  return -0.5 * (Math.cos(Math.PI * t) - 1);
}

module.exports = sineInOut;

},{}],31:[function(require,module,exports){
"use strict";

function sineIn(t) {
  var v = Math.cos(t * Math.PI * 0.5);
  if (Math.abs(v) < 1e-14) return 1;else return 1 - v;
}

module.exports = sineIn;

},{}],32:[function(require,module,exports){
"use strict";

function sineOut(t) {
  return Math.sin(t * Math.PI / 2);
}

module.exports = sineOut;

},{}],33:[function(require,module,exports){
'use strict';

module.exports = function parseUnit(str, out) {
    if (!out) out = [0, ''];

    str = String(str);
    var num = parseFloat(str, 10);
    out[0] = num;
    out[1] = str.match(/[\d.\-\+]*\s*(.*)/)[1] || '';
    return out;
};

},{}],34:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.create = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _parseUnit = require('parse-unit');

var _parseUnit2 = _interopRequireDefault(_parseUnit);

var _eases = require('eases');

var _eases2 = _interopRequireDefault(_eases);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var instances = [];
var isBrowser = typeof window !== 'undefined';

/**
 * Debounces a function that will be triggered many times.
 * @param {Function} fn
 * @param {Integer} duration
 * @returns {Function}
 */
var debounce = function debounce(fn, duration) {

  var timeout = null;

  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    clearTimeout(timeout);

    timeout = setTimeout(function () {
      return fn.apply(undefined, args);
    }, duration);
  };
};

/**
 * Returns all active instances from an array.
 * @param {Array} instances
 * @returns {Array} instances - Active instances.
 */
var getActiveInstances = function getActiveInstances(instances) {

  return instances.filter(function (instance) {
    return instance != null && instance.isActive();
  });
};

/**
 * Returns all tracked instances from an array.
 * @param {Array} instances
 * @returns {Array} instances - Tracked instances.
 */
var getTrackedInstances = function getTrackedInstances(instances) {

  return instances.filter(function (instance) {
    return instance != null && instance.getData().track;
  });
};

var scrollingElement = document.scrollingElement || document.documentElement;
var setScrollingElement = exports.setScrollingElement = function setScrollingElement(node) {
  scrollingElement = node;
}

/**
 * Returns the number of scrolled pixels.
 * @returns {Integer} scrollTop
 */
var getScrollTop = function getScrollTop() {

  // Use scrollTop because it's faster than getBoundingClientRect()
  return scrollingElement.scrollTop;
};

/**
 * Returns the height of the viewport.
 * @returns {Integer} viewportHeight
 */
var getViewportHeight = function getViewportHeight() {

  return window.innerHeight || window.outerHeight;
};

/**
 * Checks if a value is absolute.
 * An absolute value must have a value that's not NaN.
 * @param {String|Integer} value
 * @returns {Boolean} isAbsolute
 */
var isAbsoluteValue = function isAbsoluteValue(value) {

  return isNaN((0, _parseUnit2.default)(value)[0]) === false;
};

/**
 * Parses an absolute value.
 * @param {String|Integer} value
 * @returns {Object} value - Parsed value.
 */
var parseAbsoluteValue = function parseAbsoluteValue(value) {

  var parsedValue = (0, _parseUnit2.default)(value);

  return {
    value: parsedValue[0],
    unit: parsedValue[1]
  };
};

/**
 * Checks if a value is relative.
 * A relative value must start and end with [a-z] and needs a '-' in the middle.
 * @param {String|Integer} value
 * @returns {Boolean} isRelative
 */
var isRelativeValue = function isRelativeValue(value) {

  return String(value).match(/^[a-z]+-[a-z]+$/) !== null;
};

/**
 * Returns the property that should be used according to direct.
 * @param {Boolean|Node} direct
 * @param {Object} properties
 * @returns {*}
 */
var mapDirectToProperty = function mapDirectToProperty(direct, properties) {

  if (direct === true) return properties.elem;
  if (direct instanceof HTMLElement === true) return properties.direct;

  return properties.global;
};

/**
 * Converts a relative value to an absolute value.
 * @param {String} value
 * @param {Node} elem - Anchor of the relative value.
 * @param {?Integer} scrollTop - Pixels scrolled in document.
 * @param {?Integer} viewportHeight - Height of the viewport.
 * @returns {String} value - Absolute value.
 */
var relativeToAbsoluteValue = function relativeToAbsoluteValue(value, elem) {
  var scrollTop = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : getScrollTop();
  var viewportHeight = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : getViewportHeight();


  var elemSize = elem.getBoundingClientRect();

  var elemAnchor = value.match(/^[a-z]+/)[0];
  var viewportAnchor = value.match(/[a-z]+$/)[0];

  var y = 0;

  if (viewportAnchor === 'top') y -= 0;
  if (viewportAnchor === 'middle') y -= viewportHeight / 2;
  if (viewportAnchor === 'bottom') y -= viewportHeight;

  if (elemAnchor === 'top') y += elemSize.top + scrollTop;
  if (elemAnchor === 'middle') y += elemSize.top + scrollTop + elemSize.height / 2;
  if (elemAnchor === 'bottom') y += elemSize.top + scrollTop + elemSize.height;

  return y + 'px';
};

/**
 * Validates data and sets defaults for undefined properties.
 * @param {?Object} data
 * @returns {Object} data - Validated data.
 */
var validate = function validate() {
  var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};


  // Copy root object to avoid changes by reference
  data = Object.assign({}, data);

  if (data.inside == null) data.inside = function () {};
  if (data.outside == null) data.outside = function () {};
  if (data.direct == null) data.direct = false;
  if (data.track == null) data.track = true;
  if (data.props == null) data.props = {};

  if (data.from == null) throw new Error('Missing property `from`');
  if (data.to == null) throw new Error('Missing property `to`');
  if (typeof data.inside !== 'function') throw new Error('Property `inside` must be undefined or a function');
  if (typeof data.outside !== 'function') throw new Error('Property `outside` must be undefined or a function');
  if (typeof data.direct !== 'boolean' && data.direct instanceof HTMLElement === false) throw new Error('Property `direct` must be undefined, a boolean or a DOM element/node');
  if (data.direct === true && data.elem == null) throw new Error('Property `elem` is required when `direct` is true');
  if (typeof data.track !== 'boolean') throw new Error('Property `track` must be undefined or a boolean');
  if (_typeof(data.props) !== 'object') throw new Error('Property `props` must be undefined or an object');

  if (data.elem == null) {

    if (isAbsoluteValue(data.from) === false) throw new Error('Property `from` must be a absolute value when no `elem` has been provided');
    if (isAbsoluteValue(data.to) === false) throw new Error('Property `to` must be a absolute value when no `elem` has been provided');
  } else {

    if (isRelativeValue(data.from) === true) data.from = relativeToAbsoluteValue(data.from, data.elem);
    if (isRelativeValue(data.to) === true) data.to = relativeToAbsoluteValue(data.to, data.elem);
  }

  data.from = parseAbsoluteValue(data.from);
  data.to = parseAbsoluteValue(data.to);

  // Create a new props object to avoid changes by reference
  data.props = Object.keys(data.props).reduce(function (acc, key) {

    // Copy prop object to avoid changes by reference
    var prop = Object.assign({}, data.props[key]);

    if (isAbsoluteValue(prop.from) === false) throw new Error('Property `from` of prop must be a absolute value');
    if (isAbsoluteValue(prop.to) === false) throw new Error('Property `from` of prop must be a absolute value');

    prop.from = parseAbsoluteValue(prop.from);
    prop.to = parseAbsoluteValue(prop.to);

    if (prop.timing == null) prop.timing = _eases2.default['linear'];

    if (typeof prop.timing !== 'string' && typeof prop.timing !== 'function') throw new Error('Property `timing` of prop must be undefined, a string or a function');

    if (typeof prop.timing === 'string' && _eases2.default[prop.timing] == null) throw new Error('Unknown timing for property `timing` of prop');
    if (typeof prop.timing === 'string') prop.timing = _eases2.default[prop.timing];

    acc[key] = prop;

    return acc;
  }, {});

  return data;
};

/**
 * Calculates the props of an instance.
 * @param {Object} instance
 * @param {?Integer} scrollTop - Pixels scrolled in document.
 * @returns {Object} Calculated props and the element to apply styles to.
 */
var getProps = function getProps(instance) {
  var scrollTop = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : getScrollTop();


  var data = instance.getData();

  // 100% in pixel
  var total = data.to.value - data.from.value;

  // Pixel scrolled
  var current = scrollTop - data.from.value;

  // Percent scrolled
  var precisePercentage = current / (total / 100);
  var normalizedPercentage = Math.min(Math.max(precisePercentage, 0), 100);

  // Get the element that should be used according to direct
  var elem = mapDirectToProperty(data.direct, {
    global: document.documentElement,
    elem: data.elem,
    direct: data.direct
  });

  // Generate an object with all new props
  var props = Object.keys(data.props).reduce(function (acc, key) {

    var prop = data.props[key];

    // Use the unit of from OR to. It's valid to animate from '0' to '100px' and
    // '0' should be treated as 'px', too. Unit will be an empty string when no unit given.
    var unit = prop.from.unit || prop.to.unit;

    // The value that should be interpolated
    var diff = prop.from.value - prop.to.value;

    // All easing functions only remap a time value, and all have the same signature.
    // Typically a value between 0 and 1, and it returns a new float that has been eased.
    var time = prop.timing(normalizedPercentage / 100);

    var value = prop.from.value - diff * time;

    // Round to avoid unprecise values.
    // The precision of floating point computations is only as precise as the precision it uses.
    // http://stackoverflow.com/questions/588004/is-floating-point-math-broken
    var rounded = Math.round(value * 10000) / 10000;

    acc[key] = rounded + unit;

    return acc;
  }, {});

  // Use precise percentage to check if the viewport is between from and to.
  // Would always return true when using the normalized percentage.
  var isInside = precisePercentage >= 0 && precisePercentage <= 100;
  var isOutside = precisePercentage < 0 || precisePercentage > 100;

  // Execute callbacks
  if (isInside === true) data.inside(instance, precisePercentage, props);
  if (isOutside === true) data.outside(instance, precisePercentage, props);

  return {
    elem: elem,
    props: props
  };
};

/**
 * Adds a property with the specified name and value to a given style object.
 * @param {Node} elem - Styles will be applied to this element.
 * @param {Object} prop - Object with a key and value.
 */
var setProp = function setProp(elem, prop) {

  elem.style.setProperty(prop.key, prop.value);
};

/**
 * Adds properties to a given style object.
 * @param {Node} elem - Styles will be applied to this element.
 * @param {Object} props - Object of props.
 */
var setProps = function setProps(elem, props) {

  Object.keys(props).forEach(function (key) {
    return setProp(elem, {
      key: key,
      value: props[key]
    });
  });
};

/**
 * Gets and sets new props when the user has scrolled and when there are active instances.
 * This part get executed with every frame. Make sure it's performant as hell.
 * @param {Object} style - Style object.
 * @param {?Integer} previousScrollTop
 * @returns {?*}
 */
var loop = function loop(style, previousScrollTop) {

  // Continue loop
  var repeat = function repeat() {

    // It depends on the browser, but it turns out that closures
    // are sometimes faster than .bind or .apply.
    requestAnimationFrame(function () {
      return loop(style, previousScrollTop);
    });
  };

  // Get all active instances
  var activeInstances = getActiveInstances(instances);

  // Only continue when active instances available
  if (activeInstances.length === 0) return repeat();

  var scrollTop = getScrollTop();

  // Only continue when scrollTop has changed
  if (previousScrollTop === scrollTop) return repeat();else previousScrollTop = scrollTop;

  // Get and set new props of each instance
  activeInstances.map(function (instance) {
    return getProps(instance, scrollTop);
  }).forEach(function (_ref) {
    var elem = _ref.elem,
        props = _ref.props;
    return setProps(elem, props);
  });

  repeat();
};

/**
 * Creates a new instance.
 * @param {Object} data
 * @returns {Object} instance
 */
var create = exports.create = function create(data) {

  // Store the parsed data
  var _data = null;

  // Store if instance is started or stopped
  var active = false;

  // Returns if instance is started or stopped
  var _isActive = function _isActive() {

    return active;
  };

  // Returns the parsed and calculated data
  var _getData = function _getData() {

    return _data;
  };

  // Parses and calculates data
  var _calculate = function _calculate() {

    _data = validate(data);
  };

  // Update props
  var _update = function _update() {

    // Get new props
    var _getProps = getProps(instance),
        elem = _getProps.elem,
        props = _getProps.props;

    // Set new props


    setProps(elem, props);

    return props;
  };

  // Starts to animate
  var _start = function _start() {

    active = true;
  };

  // Stops to animate
  var _stop = function _stop() {

    active = false;
  };

  // Destroys the instance
  var _destroy = function _destroy() {

    // Replace instance instead of deleting the item to avoid
    // that the index of other instances changes.
    instances[index] = undefined;
  };

  // Assign instance to a variable so the instance can be used
  // elsewhere in the current function.
  var instance = {
    isActive: _isActive,
    getData: _getData,
    calculate: _calculate,
    update: _update,
    start: _start,
    stop: _stop,
    destroy: _destroy

    // Store instance in global array and save the index
  };var index = instances.push(instance) - 1;

  // Calculate data for the first time
  instance.calculate();

  return instance;
};

// Only run basicScroll when executed in a browser environment
if (isBrowser === true) {

  // Start to loop
  loop();

  // Recalculate and update instances when the window size changes
  window.addEventListener('resize', debounce(function () {

    // Get all tracked instances
    var trackedInstances = getTrackedInstances(instances);

    trackedInstances.forEach(function (instance) {
      instance.calculate();
      instance.update();
    });
  }, 50));
} else {

  console.warn('basicScroll is not executing because you are using it in an environment without a `window` object');
}

},{"eases":19,"parse-unit":33}]},{},[34])(34)
});

(() => {
  let isMobile = false
  const setIsMobile = () => isMobile = window.matchMedia("(max-width: 768px)").matches
  window.addEventListener('resize', () => { setIsMobile() }, { passive: true })
  setIsMobile()

  const initThemeSwitcher = () => {
    document.documentElement.addEventListener('dblclick', () => {
      if (document.documentElement.getAttribute('theme') === 'dark') {
        document.documentElement.setAttribute('theme', 'light')
      } else {
        document.documentElement.setAttribute('theme', 'dark')
      }
    })
  }

  const initBalanceText = () => {
    textBalancer.initialize(Array.from(document.querySelectorAll('[data-js-balance-text]')))
  }

  const initOneDotLogosAnimated = () => {
    const dPR = window.devicePixelRatio
    const animatedLogoEls = document.querySelectorAll('.OneDotLogoAnimated')

    let loaded = 0
    let position = 1050

    let w
    let h
    const image = new Image()
    image.onload = function() {
      loaded += 1
      w = this.width
      h = this.height
      load()
    }
    image.src = 'data:image/png;base64,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'

    let wm
    let hm
    const mask = new Image()
    mask.onload = function() {
      loaded += 1
      wm = this.width
      hm = this.height
      load()
    }
    mask.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA3YAAAEECAMAAABTBlZcAAAAmVBMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VHQRUAAAAMnRSTlMA5A5VnDm3EMudVvKq/BxjavYK7gNH3hbY6E2wpSwg0wbPiyaFQZB2cDG9l31bxLo2PD4BR+cAAAxLSURBVHja7NNZboIAFIbR32ojVkFGBZUx4ljFsP/FdQs8mN6Ez7OHo/7j4+Ofva9d5AxW9yO0cQbb9CNUOoNl/fgEznDuG9utNNhXP0JrDTbtR8jTYLN+fEoNN3ljuzu83Q7eLmS3exq1u8Db5ex2E7HbLYzaJex2bsVu18HbnY3abdntarHbNfB2rU27jdjt7vB2O3Y7N7Rpd4C3e8Dbbdntatm0W8Pbeex2pdjtGqN2HrtdKna7E7xdYtMuFbvdCd4uYbcLQpt2R3i7lt0uqtjt9rJpl7PbTcRuNxO73Y9Nu1rsdg28Xctutwxt2p3h7XJ2u0nMbreQSTvXY7crxW7XiN0usWnXid3uAm+Xs9ttYpt2LbtdFLLb7cVu58uk3VPsdr9it3ux22WhTbuE3W45Z7e7id3uLJN2tdjtjmK3a9ntotCmXcJuF23Z7Tqx211k0u4gdruH0O2Cgt3OiU3aRVt2u07sdheh27lXmbR7CN0uKNjtnJjd7iiTdnux2/lCtwtyoduVoUm78ovdbiZ2u6nQ7bJCFu0yT+h2t5jd7ix0u+BbFu2Cl9Dt0rnQ7RZit3vIot0yEbpdWgjdblWh27m+LNplV6HbPedCt2skcrtgJ4t2ZSF0u0MlcjvXF7pd9pJFu9tc6HZHidxuuRO6XVrIot2iErmd6wvd7o+dOslSFArCKHzRVMiSXpHWFkQQsGT/m6tj1sSJ5zjJNyDe3UBM/i+MB6LZ3U1Qz87IQDK7+w7R7DoTyexW/gb17Jx6hmR2aw8kszuMIJld7oJ6dqcHSGZXxEhmF/RHJLMzMlDPzmg2SGZnRSCYnWOXIJjd6hyinp01HEEuO8ceQTC79XkPgtltmxmoZufYC0Auu5/RCWaX+CEIZnfLNqCanVW5IJddsPRDkMsuLTJALruk3gFq2aXFEANi2SV1FAJS2Tn3vgXEslvl/h5Qys7Iry2AUHbOofBcAKHsAqubzwCp7NK/1XgElLFLLbvyFiaARHbO9vbd/2lDAInsgmTZNVm5AZDIbn3Ka/8S89MvswvS5J53lT9f7F+Ji2EXGKebXfd+1savexPDbr21lsX56kU7k5eksHOe8/+qmuFShvxaT3ZOXnzV1dUfonHnvrs1YXZpXnTnvvHm0aOM372aCbM72N911TdDdmlL892rmTC7m/1//tnY7mco6cluxQdNmJ3NB02YnccHTZidyydpdpqdZqfZaXaanWan2Wl2mp1mp9lpdprdP/bpWAAAAABgkL/1GPaXQ9ppp512m3baaaeddtppp5122mmnnXbaaaeddpt22mmnnXbaaaeddtppp5122mmnnXabdtppp5122mmnnXbaaaeddtppp512m3baxT4d2zQQBFAUFMHJgpiIgIgE91+gW/jnjZ4008Nop5122mmnnXbaaaeddtppp512t2mnnXbaaaeddtppp5122mmnnXbaaXebdtppp5122t1vd534z7d7Xid+8+3+rhOPfLuf68T3u+3OfOTbnfnMtzvzlW935qHdSDvttGvTTjvtFtppp12bdtppt9BOO+3atNNOu4V22mnXpp122i200067Nu20026hnXbatWmnnXYL7bTTrk077bRbaKeddm3aaafdQjvttGvTTjvtFtppp12bdtppt9BOO+3atNNOu4V22mnXpp122i200067Nu20026hnXbatWmnnXYL7bTTrk077bRbaKeddm3aaafdQjvttGvTTjvtFtppp12bdtppt9BOO+3atNNOu4V22mnXpp122i200067Nu20026hnXbatWmnnXYL7bTTrk077bRbaKeddm3aaafdQjvttGvTTjvtFtppp12bdtppt9BOO+3atNNOu4V22mnXpt2LfTqmAQAAYBjk3/Us7G0CHtBOu4d22mnXpp122j200067Nu200+6hnXbatWmnnXYP7bTTrk077bR7aKeddm3aaafdQzvttGvTTjvtHtppp12bdtpp99BOO+3atNNOu4d22mnXpp122j200067Nu200+6hnXbatWmnnXYP7bTTrk07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'

    const load = () => {
      if (loaded < 2) return

      start()
    }

    const start = () => {
      animatedLogoEls.forEach((el) => {
        el.style.setProperty('--aspect-ratio', hm / wm)

        const canvas = el.querySelector('.OneDotLogoAnimated--canvas')
        const context = canvas.getContext('2d')

        const frame = () => {
          requestAnimationFrame(() => {
            if (document.scrollingElement.scrollTop < window.outerHeight) {
              position = (position + .3) % w
              draw()
            }
            frame()
          })
        }

        const draw = () => {
          canvas.width = (wm * dPR) / 2
          canvas.height = (hm * dPR) / 2

          context.drawImage(image,                 - position, 0,  (w  * dPR) / 2, (hm * dPR) / 2)
          context.drawImage(image, ((w * dPR) / 2) - position, 0 , (w  * dPR) / 2, (hm * dPR) / 2)

          context.globalCompositeOperation = 'xor'
          context.drawImage(mask, 0, 0, (wm * dPR) / 2, (hm * dPR) / 2)
        }

        frame()
        draw()
      })
    }
  }

  const initDepthPerspectiveRoots = () => {
    class DepthEl {
      constructor(el) {
        this.el = el
        this.depth = parseInt(el.getAttribute('data-depth'), 10)
        this.translateY = 0
        this.targetTranslateY = 0
        this.wasDrawnOnce = false
      }

      normalize(value) {
        return Math.round(value * 100) / 100
      }

      draw() {
        if (this.translateY === this.lastDrawnTranslateY) return
        this.el.style.transform = `translate3d(0, ${ this.translateY }rem, 0)`
        this.lastDrawnTranslateY = this.translateY
        if (this.progressWasEverSet) this.wasEverDrawn = true
      }

      update() {
        if (this.wasEverDrawn) {
          this.translateY = this.normalize(.9 * this.translateY + .1 * this.targetTranslateY)
        } else {
          this.translateY = this.targetTranslateY
        }
        this.draw()
      }

      setTargetFromProgress(progress) {
        this.progressWasEverSet = true
        const depth = isMobile ? 2 : this.depth
        const progressCenter = isMobile ? 100 : 50
        this.targetTranslateY = this.normalize(65 * ((progressCenter - progress) / 100) * (1 / (depth * 3)))
        if (isMobile && this.depth !== 1) this.targetTranslateY = 0
      }
    }

    const depthRootEls = document.querySelectorAll('[data-depth-perspective-root]')

    depthRootEls.forEach((el) => {
      const depthElInstances = Array.from(el.querySelectorAll('[data-depth]')).map((el) => new DepthEl(el))
      const scrollEl = el.querySelector('[data-depth-perspective-scroll-anchor]')

      const update = (_, p) => {
        const progress = Math.max(0, Math.min(100, p))

        depthElInstances.forEach((depthElInstance) => {
          depthElInstance.setTargetFromProgress(progress)
        })
      }

      basicScroll.create({
        elem: scrollEl,
        from: 'top-bottom',
        to: 'bottom-top',
        inside: update,
        outside: update
      }).start()

      const frame = () => {
        depthElInstances.forEach((depthElInstance) => {
          depthElInstance.update()
        })

        requestAnimationFrame(frame)
      }

      frame()
    })
  }

  const init = () => {
    initThemeSwitcher()
    initBalanceText()
    initOneDotLogosAnimated()
    initDepthPerspectiveRoots()
  }

  init()
})()
