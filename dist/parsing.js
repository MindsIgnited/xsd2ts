"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sibblings = exports.OneOf = exports.Matcher = exports.Proxy = exports.Terminal = exports.Empty = exports.Parslet = exports.ASTClass = exports.ASTNode = exports.getFieldType = exports.match = exports.oneOf = exports.astField = exports.astLengthValue = exports.astRestrictions = exports.astEnumValue = exports.astNamedUntypedElm = exports.astClass = exports.NEWLINE = exports.astNode = exports.setNamespace = void 0;
/**
 * Created by eddyspreeuwers on 1/5/20.
 */
var xml_utils_1 = require("./xml-utils");
var UNBOUNDED = 'unbounded';
var returnMergedResult = function (r1, r2) { return r1.merge(r2); };
var ns = 'xs';
function setNamespace(namespace) {
    ns = namespace;
}
exports.setNamespace = setNamespace;
function astNode(s) {
    return new ASTNode(s);
}
exports.astNode = astNode;
exports.NEWLINE = '\n';
function astClass(n) {
    var result = astNode('Class');
    if (n)
        result.addName(n);
    return result;
}
exports.astClass = astClass;
function astNamedUntypedElm(n) {
    return astNode('NamedUntypedElm').named(xml_utils_1.attribs(n).name);
}
exports.astNamedUntypedElm = astNamedUntypedElm;
function astEnumValue(n) {
    return astNode('EnumValue').prop('value', xml_utils_1.attribs(n).value);
}
exports.astEnumValue = astEnumValue;
function astRestrictions(n) {
    return astNode('Restrictions').prop(xml_utils_1.xml(n).localName, xml_utils_1.attribs(n).value);
}
exports.astRestrictions = astRestrictions;
function astLengthValue(n) {
    return astNode('MaxLengthValue').prop('maxLength', xml_utils_1.attribs(n).value);
}
exports.astLengthValue = astLengthValue;
function astField() {
    return astNode('Field');
}
exports.astField = astField;
function oneOf() {
    var options = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        options[_i] = arguments[_i];
    }
    return new OneOf('ONE OFF', options);
}
exports.oneOf = oneOf;
function match(t, m) {
    return new Matcher('MATCH', t, m);
}
exports.match = match;
function getFieldType(type, defNs) {
    var key = type === null || type === void 0 ? void 0 : type.toLowerCase().split(':').reverse().shift();
    var typeMap = {
        string: "string",
        float: "number",
        double: "number",
        int: "number",
        integer: "number",
        long: "number",
        positiveinteger: "number",
        nonnegativeinteger: "number",
        decimal: "number",
        datetime: "Date",
        date: "Date",
        base64binary: "string",
        boolean: "boolean",
    };
    if (defNs && !/:/.test(type)) {
        type = defNs.toLowerCase() + '.' + xml_utils_1.capFirst(type);
    }
    else {
        type = type === null || type === void 0 ? void 0 : type.split(':').map(function (p, i, a) { return (i < a.length - 1) ? p.toLowerCase() : xml_utils_1.capFirst(p); }).join('.');
    }
    if (type === 'Number')
        type = 'number';
    return typeMap[key] || type || 'any';
}
exports.getFieldType = getFieldType;
var ASTNode = /** @class */ (function () {
    function ASTNode(type) {
        this.nodeType = type;
        this._attr = {};
    }
    ASTNode.prototype.prop = function (key, value) {
        this._attr[key] = value;
        return this;
    };
    ASTNode.prototype.named = function (name) {
        this.name = name;
        return this;
    };
    ASTNode.prototype.prefixFieldName = function (prefix) {
        this.prop('fieldName', '$' + this._attr.fieldName);
        return this;
    };
    ASTNode.prototype.addName = function (node, prefix) {
        this.name = (prefix || '') + xml_utils_1.capFirst(xml_utils_1.attribs(node).name);
        return this;
    };
    ASTNode.prototype.addField = function (node, fldType) {
        var type = fldType || getFieldType(xml_utils_1.attribs(node).type, null);
        this.prop('fieldName', xml_utils_1.attribs(node).name + ((xml_utils_1.attribs(node).minOccurs === '0') ? '?' : ''))
            .prop('fieldType', type + ((xml_utils_1.attribs(node).maxOccurs === UNBOUNDED) ? '[]' : ''));
        this.addAttribs(node);
        return this;
    };
    Object.defineProperty(ASTNode.prototype, "attr", {
        get: function () {
            return this._attr;
        },
        enumerable: false,
        configurable: true
    });
    ASTNode.prototype.addAttribs = function (n) {
        for (var i = 0; i < n.attributes.length; i++) {
            var attr = n.attributes.item(i);
            if (attr.name === 'name') {
                this.name = attr.value;
            }
            else if (attr.name === 'maxOccurs') {
                this.attr.array = attr.value === 'unbounded';
            }
            else if (attr.name === 'minOccurs') {
                this.attr.optional = attr.value === '0';
            }
            else {
                this.attr[attr.name] = attr.value;
            }
        }
        return this;
    };
    ASTNode.prototype.merge = function (other) {
        var result = new ASTNode(this.nodeType);
        result = Object.assign(result, this);
        result = Object.assign(result, other);
        Object.assign(result.attr, this.attr);
        Object.assign(result.attr, other.attr);
        result.nodeType = this.nodeType;
        return result;
    };
    return ASTNode;
}());
exports.ASTNode = ASTNode;
var ASTClass = /** @class */ (function (_super) {
    __extends(ASTClass, _super);
    function ASTClass(n) {
        var _this = _super.call(this, "Class") || this;
        _this.addName(n);
        return _this;
    }
    Object.defineProperty(ASTClass.prototype, "nodeType", {
        // @ts-ignore
        get: function () {
            return 'Class;';
        },
        enumerable: false,
        configurable: true
    });
    return ASTClass;
}(ASTNode));
exports.ASTClass = ASTClass;
var Parslet = /** @class */ (function () {
    function Parslet(name) {
        this.name = name;
        this.fnNextNode = function (x) { return x; };
    }
    // Add child at and of child chain recursively
    Parslet.prototype.addNext = function (p, fnn) {
        if (this.nextParslet) {
            this.nextParslet.addNext(p, fnn);
        }
        else {
            this.nextParslet = p;
            this.fnNextNode = fnn;
        }
        return this;
    };
    Parslet.prototype.children = function () {
        var options = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            options[_i] = arguments[_i];
        }
        var next = new Sibblings(this.name, options);
        this.addNext(next, xml_utils_1.findFirstChild);
        return this;
    };
    Parslet.prototype.child = function (t, m) {
        var next = new Matcher('MATCH', t, m);
        this.addNext(next, xml_utils_1.findFirstChild);
        return this;
    };
    Parslet.prototype.match = function (t, m) {
        var next = new Matcher('MATCH', t, m);
        this.addNext(next, function (n) { return n; });
        return this;
    };
    // public oneOf(...options: Parslet[]){
    //     const next = new OneOf('ONE OFF' , options);
    //     this.addNext(next, (n) => n);
    //     return this;
    // }
    Parslet.prototype.childIsOneOf = function () {
        var options = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            options[_i] = arguments[_i];
        }
        var next = new OneOf('ONE OFF', options);
        this.addNext(next, xml_utils_1.findFirstChild);
        return this;
    };
    Parslet.prototype.empty = function () {
        var next = new Empty('');
        this.addNext(next, xml_utils_1.findFirstChild);
        return this;
    };
    Parslet.prototype.labeled = function (s) {
        this.label = s;
        return this;
    };
    return Parslet;
}());
exports.Parslet = Parslet;
var Empty = /** @class */ (function (_super) {
    __extends(Empty, _super);
    function Empty() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Empty.prototype.parse = function (node, indent) {
        xml_utils_1.log(indent + 'Empty:, node: ', node === null || node === void 0 ? void 0 : node.nodeName);
        return (node) ? null : new ASTNode('Empty');
    };
    return Empty;
}(Parslet));
exports.Empty = Empty;
var Terminal = /** @class */ (function () {
    function Terminal(name, handler) {
        var _this = this;
        this.astNodeFactory = function (n) { return new ASTNode(_this.tagName); };
        this.name = name;
        this.tagName = name.split(':').shift();
        this.astNodeFactory = handler || this.astNodeFactory;
    }
    Terminal.prototype.parse = function (node, indent) {
        var _a;
        var result = null;
        var isElement = ((_a = xml_utils_1.xml(node)) === null || _a === void 0 ? void 0 : _a.localName) === this.tagName;
        xml_utils_1.log(indent + 'Terminal: ', this.name + ', node: ', node === null || node === void 0 ? void 0 : node.nodeName, 'found: ', isElement);
        if (isElement) {
            result = this.astNodeFactory(node);
        }
        return result;
    };
    return Terminal;
}());
exports.Terminal = Terminal;
var Proxy = /** @class */ (function (_super) {
    __extends(Proxy, _super);
    function Proxy(name) {
        return _super.call(this, name) || this;
    }
    Object.defineProperty(Proxy.prototype, "parslet", {
        set: function (p) {
            this.parsable = p;
        },
        enumerable: false,
        configurable: true
    });
    Proxy.prototype.parse = function (node, indent) {
        return this.parsable.parse(node, indent + ' ');
    };
    return Proxy;
}(Parslet));
exports.Proxy = Proxy;
var Matcher = /** @class */ (function (_super) {
    __extends(Matcher, _super);
    function Matcher(name, t, m) {
        var _this = _super.call(this, name) || this;
        _this.merger = returnMergedResult;
        _this.merger = m || _this.merger;
        _this.terminal = t;
        return _this;
    }
    Matcher.prototype.parse = function (node, indent) {
        var _a, _b, _c;
        var sibbling = node;
        var result;
        // find the first sibbling matching the terminal
        while (sibbling) {
            // log(indent, 'skip?',xml(node)?.localName );
            var skip = /(annotation|documentation)/.test((_a = xml_utils_1.xml(sibbling)) === null || _a === void 0 ? void 0 : _a.localName);
            if (!skip)
                break;
            sibbling = xml_utils_1.findNextSibbling(sibbling);
        }
        result = this.terminal.parse(sibbling, indent + ' ');
        xml_utils_1.log(indent, this.name, this.terminal.tagName, 'node: ', sibbling === null || sibbling === void 0 ? void 0 : sibbling.nodeName, 'match:', JSON.stringify(result));
        xml_utils_1.log(indent, this.name, 'next: ', (_b = this.nextParslet) === null || _b === void 0 ? void 0 : _b.name, ((_c = this.nextParslet) === null || _c === void 0 ? void 0 : _c.label) || '');
        if (result && this.nextParslet) {
            var nextResult = this.nextParslet.parse(this.fnNextNode(sibbling), indent + ' ');
            if (nextResult) {
                result = this.merger(result, nextResult);
            }
            else {
                xml_utils_1.log(indent, 'no next result', this.name);
                result = null;
            }
        }
        xml_utils_1.log(indent, this.name, 'result: ', JSON.stringify(result));
        return result;
    };
    return Matcher;
}(Parslet));
exports.Matcher = Matcher;
var OneOf = /** @class */ (function (_super) {
    __extends(OneOf, _super);
    function OneOf(name, options) {
        var _this = _super.call(this, name) || this;
        _this.options = options;
        return _this;
    }
    OneOf.prototype.parse = function (node, indent) {
        var nextNode = this.fnNextNode(node);
        xml_utils_1.log(indent + 'ONE OFF:', this.options.map(function (o) { return o.label; }).join(','), node === null || node === void 0 ? void 0 : node.nodeName, nextNode === null || nextNode === void 0 ? void 0 : nextNode.nodeName);
        var result = null;
        var count = 1;
        for (var _i = 0, _a = this.options || []; _i < _a.length; _i++) {
            var option = _a[_i];
            xml_utils_1.log(indent + ' try:', option.name, '#', count++, option.label || '');
            result = option.parse(nextNode, indent + '  ');
            if (result) {
                break;
            }
        }
        return result;
    };
    return OneOf;
}(Parslet));
exports.OneOf = OneOf;
var Sibblings = /** @class */ (function (_super) {
    __extends(Sibblings, _super);
    function Sibblings(name, options) {
        var _this = _super.call(this, name) || this;
        _this.options = options;
        return _this;
    }
    Sibblings.prototype.parse = function (node, indent) {
        var _a;
        xml_utils_1.log(indent + 'Collect all :', this.options.map(function (x) { return x.name; }).join(','), node === null || node === void 0 ? void 0 : node.nodeName);
        var sibbling = node;
        var result = new ASTNode("Sibblings");
        result.children = [];
        while (sibbling) {
            xml_utils_1.log(indent + 'list sibbling:', sibbling === null || sibbling === void 0 ? void 0 : sibbling.nodeName);
            var skip = /(annotation|documentation)/.test((_a = xml_utils_1.xml(sibbling)) === null || _a === void 0 ? void 0 : _a.localName);
            if (!skip) {
                //const listItem = this.parsable.parse(sibbling, indent + '  ');
                var listItem = null;
                var count = 0;
                for (var _i = 0, _b = this.options || []; _i < _b.length; _i++) {
                    var option = _b[_i];
                    xml_utils_1.log(indent + ' try:', option.name, '#', count++, option.label || '');
                    listItem = option.parse(sibbling, indent + '  ');
                    if (listItem) {
                        break;
                    }
                }
                if (listItem) {
                    result.children.push(listItem);
                }
            }
            sibbling = xml_utils_1.findNextSibbling(sibbling);
        }
        return result;
    };
    return Sibblings;
}(Parslet));
exports.Sibblings = Sibblings;
