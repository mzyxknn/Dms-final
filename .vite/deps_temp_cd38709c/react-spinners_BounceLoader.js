import {
  require_react
} from "./chunk-VEL4RUZ4.js";
import {
  __commonJS
} from "./chunk-HM4MQYWN.js";

// node_modules/react-spinners/helpers/unitConverter.js
var require_unitConverter = __commonJS({
  "node_modules/react-spinners/helpers/unitConverter.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cssValue = exports.parseLengthAndUnit = void 0;
    var cssUnit = {
      cm: true,
      mm: true,
      in: true,
      px: true,
      pt: true,
      pc: true,
      em: true,
      ex: true,
      ch: true,
      rem: true,
      vw: true,
      vh: true,
      vmin: true,
      vmax: true,
      "%": true
    };
    function parseLengthAndUnit(size) {
      if (typeof size === "number") {
        return {
          value: size,
          unit: "px"
        };
      }
      var value;
      var valueString = (size.match(/^[0-9.]*/) || "").toString();
      if (valueString.includes(".")) {
        value = parseFloat(valueString);
      } else {
        value = parseInt(valueString, 10);
      }
      var unit = (size.match(/[^0-9]*$/) || "").toString();
      if (cssUnit[unit]) {
        return {
          value,
          unit
        };
      }
      console.warn("React Spinners: ".concat(size, " is not a valid css value. Defaulting to ").concat(value, "px."));
      return {
        value,
        unit: "px"
      };
    }
    exports.parseLengthAndUnit = parseLengthAndUnit;
    function cssValue(value) {
      var lengthWithunit = parseLengthAndUnit(value);
      return "".concat(lengthWithunit.value).concat(lengthWithunit.unit);
    }
    exports.cssValue = cssValue;
  }
});

// node_modules/react-spinners/helpers/animation.js
var require_animation = __commonJS({
  "node_modules/react-spinners/helpers/animation.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createAnimation = void 0;
    var createAnimation = function(loaderName, frames, suffix) {
      var animationName = "react-spinners-".concat(loaderName, "-").concat(suffix);
      if (typeof window == "undefined" || !window.document) {
        return animationName;
      }
      var styleEl = document.createElement("style");
      document.head.appendChild(styleEl);
      var styleSheet = styleEl.sheet;
      var keyFrames = "\n    @keyframes ".concat(animationName, " {\n      ").concat(frames, "\n    }\n  ");
      if (styleSheet) {
        styleSheet.insertRule(keyFrames, 0);
      }
      return animationName;
    };
    exports.createAnimation = createAnimation;
  }
});

// node_modules/react-spinners/BounceLoader.js
var require_BounceLoader = __commonJS({
  "node_modules/react-spinners/BounceLoader.js"(exports) {
    var __assign = exports && exports.__assign || function() {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p))
              t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __rest = exports && exports.__rest || function(s, e) {
      var t = {};
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
          t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
            t[p[i]] = s[p[i]];
        }
      return t;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var React = __importStar(require_react());
    var unitConverter_1 = require_unitConverter();
    var animation_1 = require_animation();
    var bounce = (0, animation_1.createAnimation)("BounceLoader", "0% {transform: scale(0)} 50% {transform: scale(1.0)} 100% {transform: scale(0)}", "bounce");
    function BounceLoader(_a) {
      var _b = _a.loading, loading = _b === void 0 ? true : _b, _c = _a.color, color = _c === void 0 ? "#000000" : _c, _d = _a.speedMultiplier, speedMultiplier = _d === void 0 ? 1 : _d, _e = _a.cssOverride, cssOverride = _e === void 0 ? {} : _e, _f = _a.size, size = _f === void 0 ? 60 : _f, additionalprops = __rest(_a, ["loading", "color", "speedMultiplier", "cssOverride", "size"]);
      var style = function(i) {
        var animationTiming = i === 1 ? "".concat(1 / speedMultiplier, "s") : "0s";
        return {
          position: "absolute",
          height: (0, unitConverter_1.cssValue)(size),
          width: (0, unitConverter_1.cssValue)(size),
          backgroundColor: color,
          borderRadius: "100%",
          opacity: 0.6,
          top: 0,
          left: 0,
          animationFillMode: "both",
          animation: "".concat(bounce, " ").concat(2.1 / speedMultiplier, "s ").concat(animationTiming, " infinite ease-in-out")
        };
      };
      var wrapper = __assign({ display: "inherit", position: "relative", width: (0, unitConverter_1.cssValue)(size), height: (0, unitConverter_1.cssValue)(size) }, cssOverride);
      if (!loading) {
        return null;
      }
      return React.createElement(
        "span",
        __assign({ style: wrapper }, additionalprops),
        React.createElement("span", { style: style(1) }),
        React.createElement("span", { style: style(2) })
      );
    }
    exports.default = BounceLoader;
  }
});
export default require_BounceLoader();
//# sourceMappingURL=react-spinners_BounceLoader.js.map
