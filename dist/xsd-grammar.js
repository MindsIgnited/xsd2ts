"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XsdGrammar = void 0;
/**
 * Created by eddyspreeuwers on 12/18/19.
 */
var xml_utils_1 = require("./xml-utils");
var parsing_1 = require("./parsing");
function makeSchemaHandler(schemaName) {
    return function (n) { return new parsing_1.ASTNode("schema").named(schemaName).addAttribs(n); };
}
var restrictions = 'pattern,maxLength,length,minInclusive,maxInclusive'.split(',');
var numberRegExp = /(float|integer|double|positiveInteger|negativeInteger|nonNegativeInteger|decimal)/;
var fieldHandler = function (n) { return (xml_utils_1.attribs(n).type) ? parsing_1.astNode('Field').addField(n).prop('label4', 'fieldHandler') : null; };
//const topFieldHandler: AstNodeFactory = (n) => /xs:/.test(attribs(n).type) ? astClass().addName(n, 'For').addFields(n) : null;
var topFieldHandler = function (n) {
    var _a;
    console.log('topFieldHandler type:', xml_utils_1.attribs(n).name, xml_utils_1.attribs(n).type, n.hasChildNodes());
    //this element must not have any children except annotation and documentation
    var child = n.firstChild;
    while (child) {
        if (child.nodeType == child.ELEMENT_NODE) {
            console.log('  ** :', child.nodeName, (_a = xml_utils_1.attribs(child)) === null || _a === void 0 ? void 0 : _a.name, xml_utils_1.attribs(n).name);
            if (!/(annotation|documentation)/.test(child.nodeName)) {
                return null;
            }
        }
        child = child.nextSibling;
    }
    //return (primitives.test(attribs(n).type) || attribs(n).abstract == 'true') ? astNode('AliasType').addAttribs(n) : null;
    return (xml_utils_1.attribs(n).type || xml_utils_1.attribs(n).abstract) ? parsing_1.astNode('AliasType').addAttribs(n).prop('element', 'true') : null;
    //return /\w:/.test(attribs(n).type) ? astNode('AliasType').addAttribs(n) : null;
};
var attrHandler = function (n) { return parsing_1.astNode('Field').addField(n).prefixFieldName('$'); };
var arrayFldHandler = function (n) { return (xml_utils_1.attribs(n).type && xml_utils_1.attribs(n).maxOccurs === "unbounded") ? parsing_1.astNode('ArrField').addField(n).prop('label1', 'arrayFldHandler') : null; };
var cmpFldHandler = function (n) { return parsing_1.astField().prop('label2', 'cmpFldHandler').addField(n, xml_utils_1.capFirst(xml_utils_1.attribs(n).name)); };
var classHandler = function (n) { return (xml_utils_1.attribs(n).type) ? null : parsing_1.astClass(n).prop('label3', 'classHandler'); };
var classElmHandler = function (n) { return (xml_utils_1.attribs(n).type) ? null : parsing_1.astClass(n).prop('label3', 'classElmHandler').prop('element', 'true'); };
var namedUntypedElmHandler = function (n) { return (xml_utils_1.attribs(n).type || !xml_utils_1.attribs(n).name) ? null : parsing_1.astNamedUntypedElm(n).prop('element', 'true'); };
var enumerationHandler = function (n) { return (xml_utils_1.attribs(n).value) ? parsing_1.astEnumValue(n) : null; };
var restrictionHandler = function (n) { return (xml_utils_1.attribs(n).value) ? parsing_1.astRestrictions(n) : null; };
var extensionHandler = function (n) { return parsing_1.astNode('Extension').addAttribs(n); };
var nrRestrictionHandler = function (n) { return numberRegExp.test(xml_utils_1.attribs(n).base) ? parsing_1.astNode('AliasType').prop('value', 'number') : null; };
var strRestrictionHandler = function (n) { return /string/.test(xml_utils_1.attribs(n).base) ? parsing_1.astNode('EnumOrAliasType').prop('value', 'string') : null; };
var dtRestrictionHandler = function (n) { return /(dateTime|date)/.test(xml_utils_1.attribs(n).base) ? parsing_1.astNode('AliasType').prop('value', 'Date') : null; };
var namedGroupHandler = function (n) { return (xml_utils_1.attribs(n).name) ? parsing_1.astNode('Group').named(xml_utils_1.attribs(n).name) : null; };
var namedSimpleTypeHandler = function (n) { return (xml_utils_1.attribs(n).name) ? parsing_1.astNode('SimpleType').named(xml_utils_1.attribs(n).name) : null; };
var refGroupHandler = function (n) { return (xml_utils_1.attribs(n).ref) ? parsing_1.astNode('Fields').prop('ref', xml_utils_1.attribs(n).ref) : null; };
var refElementHandler = function (n) { return (xml_utils_1.attribs(n).ref) ? parsing_1.astNode('Reference').addAttribs(n) : null; };
var childsMerger = function (r1, r2) { r1.children = r2.children; return r1; };
var ccontSeqAttrMerger = function (r1, r2) {
    var _a;
    (_a = r2.children) === null || _a === void 0 ? void 0 : _a.forEach(function (c) {
        //organize children
        //console.log('c.nodeType', c.nodeType, c);
        if (c.nodeType === 'complexContent') {
            r1.attr.base = c.attr.base;
            r1.children = (r1.children || []).concat(c.children);
        }
        else if (c.nodeType === 'sequence') {
            r1.children = (r1.children || []).concat(c.children);
        }
        else if (c.nodeType === 'Field') {
            if (r1.children)
                r1.children.push(c);
            else
                r1.children = [c];
        }
        else if (c.nodeType === 'Fields') {
            if (r1.children)
                r1.children.push(c);
            else
                r1.children = [c];
        }
        else {
            console.log('nodeType not handled: ', c.nodeType, c);
        }
    });
    return r1;
};
var enumMerger = function (r1, r2) { r1.nodeType = 'Enumeration'; r1.attr.values = r2.children; return r1; };
var typeMerger = function (r1, r2) { r1.nodeType = 'AliasType'; r1.attr.type = r2.attr.value; return r1; };
var newLine = function (s) { return s ? parsing_1.NEWLINE : ''; };
var patternChildrenMerger = function (r1, r2) {
    var _a, _b;
    if (!((_a = r2.children) === null || _a === void 0 ? void 0 : _a.length))
        return null;
    r1.nodeType = 'AliasType';
    r1.attr.type = r2.attr.value || 'string';
    (_b = r2.children) === null || _b === void 0 ? void 0 : _b.forEach(function (c) {
        restrictions.forEach(function (p) {
            if (c.attr[p]) {
                r1.attr[p] = c.attr[p];
            }
        });
    });
    return r1;
};
var patternChildMerger = function (r1, r2) {
    r1.nodeType = 'AliasType';
    r1.attr.type = r2.attr.type || 'string';
    restrictions.forEach(function (p) {
        if (r2.attr[p]) {
            r1.attr[p] = r2.attr[p];
        }
    });
    return r1;
};
//const lengthMerger: AstNodeMerger = (r1, r2) => {r1.nodeType = 'AliasType'; r1.attr.type = r2.attr.value;r1.attr.pattern = r2.attr.maxLength; return r1; };
var nestedClassMerger = function (r1, r2) { r1.nodeType = 'Field'; r1.attr.nestedClass = { name: r1.attr.fieldType, children: r2.children }; return r1; };
var arrayFieldMerger = function (r1, r2) { r2.nodeType = 'Field'; r2.attr.fieldName = r1.attr.fieldName; return r2; };
var XsdGrammar = /** @class */ (function () {
    function XsdGrammar(name) {
        this.schemaName = name;
    }
    XsdGrammar.prototype.parse = function (node) {
        //Terminals
        var FIELDPROXY = new parsing_1.Proxy('Field Proxy');
        var fieldElement = new parsing_1.Terminal("element:fld", fieldHandler);
        var cmpFldElement = new parsing_1.Terminal("element:comp", cmpFldHandler);
        var arrFldElement = new parsing_1.Terminal("element:array", arrayFldHandler);
        var classElement = new parsing_1.Terminal("element:class", classElmHandler);
        var topFldElement = new parsing_1.Terminal("element:topFld", topFieldHandler);
        var eNamedUntyped = new parsing_1.Terminal("element:namedUntypedElm", namedUntypedElmHandler);
        var attributeGroup = new parsing_1.Terminal("attributeGroup:attrGrp", namedGroupHandler);
        var schema = new parsing_1.Terminal("schema:Schema", makeSchemaHandler(this.schemaName));
        var namedGroup = new parsing_1.Terminal("group:named", namedGroupHandler);
        var refGroup = new parsing_1.Terminal("group:refGrp", refGroupHandler);
        var attrRefGroup = new parsing_1.Terminal("attributeGroup:attrRefGrp", refGroupHandler);
        var refElement = new parsing_1.Terminal("element:refElm", refElementHandler);
        var complexType = new parsing_1.Terminal("complexType");
        var simpleType = new parsing_1.Terminal("simpleType");
        var namedSimpleType = new parsing_1.Terminal("simpleType", namedSimpleTypeHandler);
        var complexContent = new parsing_1.Terminal("complexContent");
        var extension = new parsing_1.Terminal("extension", extensionHandler);
        var enumeration = new parsing_1.Terminal("enumeration:enum", enumerationHandler);
        var strRestriction = new parsing_1.Terminal("restriction:strRestr", strRestrictionHandler);
        var nrRestriction = new parsing_1.Terminal("restriction:nrRestr", nrRestrictionHandler);
        var dtRestriction = new parsing_1.Terminal("restriction:dtRestr", dtRestrictionHandler);
        var strPattern = new parsing_1.Terminal("pattern", restrictionHandler);
        var strMaxLength = new parsing_1.Terminal("maxLength", restrictionHandler);
        var strLength = new parsing_1.Terminal("length", restrictionHandler);
        var minInclusive = new parsing_1.Terminal("minInclusive", restrictionHandler);
        var maxInclusive = new parsing_1.Terminal("maxInclusive", restrictionHandler);
        var classType = new parsing_1.Terminal("complexType:ctype", classHandler);
        var attribute = new parsing_1.Terminal("attribute:attr", attrHandler);
        var sequence = new parsing_1.Terminal("sequence:seq");
        var choice = new parsing_1.Terminal("choice:Choice");
        // NonTerminals
        var ATTREFGRP = parsing_1.match(attrRefGroup).labeled('ATTRGRP');
        var REFGROUP = parsing_1.match(refGroup).labeled('REF_GROUP');
        var REF_ELM = parsing_1.match(refElement).labeled('REF_ELEMENT');
        var ATTRIBUTE = parsing_1.match(attribute).labeled('ATTRIBUTE');
        var FLD_ELM = parsing_1.match(fieldElement).labeled('FIELD_ELM');
        var CHOICE = parsing_1.match(choice).children(REF_ELM, FIELDPROXY);
        var ARRFIELD = parsing_1.match(cmpFldElement, arrayFieldMerger).child(complexType).child(sequence).child(arrFldElement).labeled('ARRFIELD');
        var CMPFIELD = parsing_1.match(cmpFldElement, nestedClassMerger).child(complexType).child(sequence).children(FIELDPROXY).labeled('CMPFIELD');
        var FIELD = parsing_1.oneOf(ARRFIELD, CMPFIELD, FLD_ELM, REFGROUP, REF_ELM, CHOICE).labeled('FIELD');
        FIELDPROXY.parslet = FIELD;
        var A_CLASS = parsing_1.match(classElement, childsMerger).child(complexType).children(ATTRIBUTE, CHOICE, ATTREFGRP).labeled('A_CLASS');
        // element class
        var E_CLASS = parsing_1.match(classElement).child(complexType).child(sequence, childsMerger).children(FIELD).labeled('E_CLASS');
        var Z_CLASS = parsing_1.match(classElement).empty().labeled('Z_CLASS');
        // group class
        var G_CLASS = parsing_1.match(attributeGroup).children(parsing_1.match(attribute)).labeled('G_CLASS');
        // coplex type class
        var SEQUENCE = parsing_1.match(sequence, childsMerger).children(FIELD).labeled('SEQUENCE');
        var CCONTENT = parsing_1.match(complexContent).child(extension).child(sequence, childsMerger).children(FIELD).labeled('CCONTENT');
        var R_CLASS = parsing_1.match(classType, childsMerger).children(REFGROUP, ATTRIBUTE).labeled('R_CLASS');
        //const C_CLASS  = match(classType).childIsOneOf(SEQUENCE, CCONTENT).labeled('C_CLASS');
        var C_CLASS = parsing_1.match(classType, ccontSeqAttrMerger).children(SEQUENCE, CCONTENT, REFGROUP, ATTRIBUTE).labeled('C_CLASS');
        //extended class
        var X_CLASS = parsing_1.match(classType).child(complexContent).child(extension).child(sequence, childsMerger).children(FIELD).labeled('X_CLASS');
        //const R_CLASS  = match(classType).child(refGroup);
        var S_CLASS = parsing_1.match(classType).empty().labeled('EMPTY_CLASS'); //simple empty class
        var F_CLASS = parsing_1.match(topFldElement).labeled('F_CLASS');
        var N_GROUP = parsing_1.match(namedGroup).child(sequence, childsMerger).children(FIELD).labeled('N_GROUP');
        var ENUMELM = parsing_1.match(eNamedUntyped, enumMerger).child(simpleType).child(strRestriction).children(parsing_1.match(enumeration)).labeled('ENUMELM');
        var ENUMTYPE = parsing_1.match(namedSimpleType, enumMerger).child(strRestriction).children(parsing_1.match(enumeration)).labeled('ENUMTYPE');
        var SRESTR = parsing_1.oneOf(parsing_1.match(strPattern), parsing_1.match(strMaxLength), parsing_1.match(strLength));
        var NRESTR = parsing_1.oneOf(parsing_1.match(strPattern), parsing_1.match(minInclusive), parsing_1.match(maxInclusive), parsing_1.match(strMaxLength));
        //const ENUM2    = match(namedSimpleType).child(strRestriction).children(match(enumeration)).labeled('ENUMTYPE2');
        //const ALIAS1   = match(eNamedUntyped, typeMerger).child(simpleType).child(nrRestriction).labeled('ALIAS1');
        var ALIAS1 = parsing_1.match(namedSimpleType, typeMerger).child(dtRestriction).labeled('ALIAS1');
        var ALIAS2 = parsing_1.match(namedSimpleType, patternChildrenMerger).child(nrRestriction, childsMerger).children(NRESTR).labeled('ALIAS2');
        var ALIAS3 = parsing_1.match(namedSimpleType, patternChildrenMerger).child(strRestriction, childsMerger).children(SRESTR).labeled('ALIAS3');
        var ALIAS4 = parsing_1.match(eNamedUntyped, patternChildMerger).child(simpleType, patternChildrenMerger).child(strRestriction, childsMerger).children(SRESTR).labeled('ALIAS4');
        var ALIAS5 = parsing_1.match(eNamedUntyped, patternChildMerger).child(simpleType, patternChildrenMerger).child(nrRestriction, childsMerger).children(NRESTR).labeled('ALIAS5');
        var TYPES = parsing_1.oneOf(ALIAS1, ALIAS2, ALIAS3, ALIAS4, ALIAS5, S_CLASS, ENUMELM, ENUMTYPE, E_CLASS, C_CLASS, X_CLASS, N_GROUP, G_CLASS, A_CLASS, R_CLASS, Z_CLASS, F_CLASS);
        var SCHEMA = parsing_1.match(schema, childsMerger).children(TYPES);
        var result = SCHEMA.parse(node, '');
        return result;
    };
    return XsdGrammar;
}());
exports.XsdGrammar = XsdGrammar;
