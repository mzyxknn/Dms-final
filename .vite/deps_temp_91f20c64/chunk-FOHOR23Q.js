import {
  Anchor_default
} from "./chunk-HCPBPWPN.js";
import {
  require_classnames,
  require_jsx_runtime,
  useBootstrapPrefix
} from "./chunk-NPRAUHUT.js";
import {
  require_react
} from "./chunk-VEL4RUZ4.js";
import {
  __toESM
} from "./chunk-HM4MQYWN.js";

// node_modules/react-bootstrap/esm/Breadcrumb.js
var import_classnames2 = __toESM(require_classnames());
var React2 = __toESM(require_react());

// node_modules/react-bootstrap/esm/BreadcrumbItem.js
var import_classnames = __toESM(require_classnames());
var React = __toESM(require_react());
var import_jsx_runtime = __toESM(require_jsx_runtime());
var BreadcrumbItem = React.forwardRef(({
  bsPrefix,
  active = false,
  children,
  className,
  // Need to define the default "as" during prop destructuring to be compatible with styled-components github.com/react-bootstrap/react-bootstrap/issues/3595
  as: Component = "li",
  linkAs: LinkComponent = Anchor_default,
  linkProps = {},
  href,
  title,
  target,
  ...props
}, ref) => {
  const prefix = useBootstrapPrefix(bsPrefix, "breadcrumb-item");
  return (0, import_jsx_runtime.jsx)(Component, {
    ref,
    ...props,
    className: (0, import_classnames.default)(prefix, className, {
      active
    }),
    "aria-current": active ? "page" : void 0,
    children: active ? children : (0, import_jsx_runtime.jsx)(LinkComponent, {
      ...linkProps,
      href,
      title,
      target,
      children
    })
  });
});
BreadcrumbItem.displayName = "BreadcrumbItem";
var BreadcrumbItem_default = BreadcrumbItem;

// node_modules/react-bootstrap/esm/Breadcrumb.js
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
var Breadcrumb = React2.forwardRef(({
  bsPrefix,
  className,
  listProps = {},
  children,
  label = "breadcrumb",
  // Need to define the default "as" during prop destructuring to be compatible with styled-components github.com/react-bootstrap/react-bootstrap/issues/3595
  as: Component = "nav",
  ...props
}, ref) => {
  const prefix = useBootstrapPrefix(bsPrefix, "breadcrumb");
  return (0, import_jsx_runtime2.jsx)(Component, {
    "aria-label": label,
    className,
    ref,
    ...props,
    children: (0, import_jsx_runtime2.jsx)("ol", {
      ...listProps,
      className: (0, import_classnames2.default)(prefix, listProps == null ? void 0 : listProps.className),
      children
    })
  });
});
Breadcrumb.displayName = "Breadcrumb";
var Breadcrumb_default = Object.assign(Breadcrumb, {
  Item: BreadcrumbItem_default
});

export {
  BreadcrumbItem_default,
  Breadcrumb_default
};
//# sourceMappingURL=chunk-FOHOR23Q.js.map
