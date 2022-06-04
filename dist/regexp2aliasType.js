"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regexpPattern2typeAlias = exports.expression = exports.group = exports.option = exports.variants = exports.series = exports.specials = exports.repeat = exports.char = exports.range = exports.makeVariants = exports.buildVariants = exports.allC = exports.allW = exports.leestekens = exports.A2Z = exports.a2z = exports.digits = void 0;
/**
 * Created by eddyspreeuwers on 4/24/21.
 */
var xml_utils_1 = require("./xml-utils");
exports.digits = '0123456789';
exports.a2z = 'abcdefghijklmnopqrstuvwxyz';
exports.A2Z = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
exports.leestekens = '~§±!@#$%^&*()-_=+[]{}|;:.,\'"'.split('').sort().join('');
exports.allW = exports.digits + exports.A2Z + exports.a2z;
exports.allC = exports.digits + exports.A2Z + exports.a2z + exports.leestekens;
var CHAR_TYPE = 'char';
var MAX_OPTIONS_LENGTH = 1000;
var MAX_LENGTH = 100;
var SPECIALS = {
    '\\d': exports.digits,
    '\\w': exports.allW,
    '\\.': '.',
    '\\-': '-',
    '\\[': '[',
    '\\]': ']',
    '\\{': '{',
    '\\}': '}',
    '\\*': '*',
    '\\+': '+',
    '\\^': '^',
    '\\?': '?',
    '.': exports.allC,
    '\\\\': '\\\\',
};
function buildVariants(optionVariants, series, maxLength) {
    var newOptionVariants = {};
    (optionVariants || []).forEach(function (ov) {
        (series || []).forEach(function (s) {
            if ((maxLength || 10000) >= (ov + s).length) {
                newOptionVariants[ov + s] = 1;
            }
            else {
                newOptionVariants[ov] = 1;
            }
        });
    });
    return Object.keys(newOptionVariants).sort();
}
exports.buildVariants = buildVariants;
function makeVariants(optionVariants, series, maxLength) {
    return buildVariants(optionVariants, series.split(''), maxLength);
}
exports.makeVariants = makeVariants;
function invertSeries(res) {
    return exports.allC.split('').filter(function (e) { return res.indexOf(e) < 0; }).join('');
}
function expandRange(start, end) {
    return start + exports.allW.split(start).reverse().shift().split(end).shift() + end;
}
function range(index, pattern) {
    var result = '';
    var part = pattern.substring(index);
    var matches = part.match(/\^?(\w-\w)/);
    //console.log('    range matches:', matches);
    if (matches && matches.index === 0) {
        var _a = matches[1].split('-'), start = _a[0], end = _a[1];
        //console.log('    start:', start, 'end', end);
        //select all chars in the range from all chars available
        var res = expandRange(start, end);
        //invert selection by filtering out the res chars from all chars
        if (part.indexOf('^') === 0) {
            res = invertSeries(res);
        }
        result += res;
        index += matches[0].length;
    }
    //console.log('    range:', result);
    return [result, index];
}
exports.range = range;
function char(index, pattern) {
    var result = '';
    var part = pattern.substring(index);
    var matches = part.match(/\^?(\w|<|>|!|#"%|&|=|_)/);
    //console.log('char matches:', matches);
    if (matches && matches.index === 0) {
        //console.log('char:', matches[1]);
        result += (pattern[index] === '^') ? invertSeries(matches[1]) : matches[1];
        index += matches[0].length;
    }
    //console.log('    char:', result);
    return [result, index];
}
exports.char = char;
function repeat(index, pattern) {
    var result = '';
    var part = pattern.substring(index);
    var matches = part.match(/\{(\d+)(,\d+)?\}/);
    //console.log('char matches:', matches);
    if (matches && matches.index === 0) {
        //console.log('char:', matches[1]);
        var min = matches[1];
        var max_1 = matches[2] || (',' + matches[1]);
        result = [min, max_1].join('');
        index += matches[0].length;
    }
    //console.log('  repeat:', result);
    return [result, index];
}
exports.repeat = repeat;
function specials(index, pattern) {
    var result = '';
    var part = pattern.substring(index);
    //console.log('idx, pattern:', index, pattern);
    for (var t in SPECIALS) {
        if (part.indexOf(t) === 0) {
            //console.log('    special found:', t);
            result = SPECIALS[t];
            index += t.length;
            break;
        }
    }
    //console.log('    specials:', result);
    return [result, index];
}
exports.specials = specials;
function series(index, pattern) {
    var _a, _b, _c;
    if (pattern[index] !== '[') {
        return ['', index];
    }
    var offset = index;
    var _d = ['', 0], r = _d[0], i = _d[1];
    var result = '';
    index++;
    while (pattern[index] !== ']') {
        _a = specials(index, pattern), r = _a[0], i = _a[1];
        if (r) {
            result += r;
            index = i;
            continue;
        }
        _b = range(index, pattern), r = _b[0], i = _b[1];
        if (r) {
            result += r;
            index = i;
            continue;
        }
        _c = char(index, pattern), r = _c[0], i = _c[1];
        if (r) {
            result += r;
            index = i;
            continue;
        }
        if (index >= pattern.length) {
            return ['', offset];
        }
        //console.log('series subresult:', result, index , pattern.length);
        break;
    }
    if (pattern[index] === ']') {
        index++;
    }
    //console.log('   series result:', result, index , pattern.length);
    return [result, index];
}
exports.series = series;
function variants(pattern, index, maxLength) {
    if (index === void 0) { index = 0; }
    if (maxLength === void 0) { maxLength = MAX_LENGTH; }
    //console.log('   variants pattern:', index, pattern, pattern[index]);
    var offset = index;
    var _a = ['', 0], r = _a[0], i = _a[1];
    var result = null;
    var options = [''];
    var startOptionIndex = 0;
    var lastOptionType = null;
    var _loop_1 = function () {
        var _a, _b, _c, _d;
        //console.log('    while variant:', result, options, pattern );
        _a = specials(index, pattern), r = _a[0], i = _a[1];
        if (r) {
            startOptionIndex = options.length;
            options = makeVariants(options, r, maxLength);
            index = i;
            result = r;
            lastOptionType = 'special';
            return "continue";
        }
        _b = series(index, pattern), r = _b[0], i = _b[1];
        if (r) {
            startOptionIndex = options.length;
            options = makeVariants(options, r, maxLength);
            index = i;
            result = r;
            lastOptionType = 'series';
            return "continue";
        }
        //console.log('na series:', result, options );
        _c = char(index, pattern), r = _c[0], i = _c[1];
        if (r) {
            startOptionIndex = options.length;
            options = makeVariants(options, r, maxLength);
            index = i;
            result = r;
            lastOptionType = CHAR_TYPE;
            return "continue";
        }
        //dectect {1} construct
        _d = repeat(index, pattern), r = _d[0], i = _d[1];
        if (r) {
            var _e = r.split(',').map(function (s) { return +s; }), min_1 = _e[0], max_2 = _e[1];
            options = options.map(function (o) { return o.substring(0, o.length - 1); });
            var orgLength_1 = options[options.length - 1].length;
            //options = options.map(o => o.substring(0, o.length - 1));
            var chars = result.split('');
            chars.unshift('');
            while (options[options.length - 1].length < Math.min(maxLength, (1 + max_2)) && options.length < MAX_OPTIONS_LENGTH) {
                //console.log('    buildVariants options:', options, result, Math.min(maxLength, +max), options[options.length - 1].length, r);
                options = buildVariants(options, chars, maxLength);
            }
            options = options.filter(function (o) { return o.length >= orgLength_1 + min_1; });
            index = i;
            return "continue";
        }
        var c = pattern[index];
        if ((c === '*' || c === '+' || c === '?') && result !== null) {
            if (c === '*' || c === '?') {
                options = options.map(function (o) { return o.substring(0, o.length - 1); });
            }
            var chars = result.split('');
            chars.unshift('');
            while (options[options.length - 1].length < maxLength && options.length < MAX_OPTIONS_LENGTH) {
                //console.log('    buildVariants options:', options, result, maxLength, options[options.length - 1].length);
                options = buildVariants(options, chars, maxLength);
                if (c === '?') {
                    break; // 0 or 1 time
                }
            }
            index++;
            return "continue";
        }
        return "break";
    };
    while (pattern[index] !== '|' && pattern[index] !== ')' && index < pattern.length) {
        var state_1 = _loop_1();
        if (state_1 === "break")
            break;
    }
    result = (offset === index) ? null : options;
    //console.log('   variants result:', result, 'next:', pattern[index]);
    return [result, index];
}
exports.variants = variants;
function option(pattern, index, maxLength) {
    var _a;
    if (index === void 0) { index = 0; }
    if (maxLength === void 0) { maxLength = MAX_LENGTH; }
    //console.log('  options pattern:', index, pattern, pattern[index]);
    var offset = index;
    var _b = [null, 0], r = _b[0], i = _b[1];
    var result = null;
    while (index < pattern.length) {
        //console.log('  while option:', result, pattern[index], 'subpattern:', pattern.substring(index));
        _a = variants(pattern, index), r = _a[0], i = _a[1];
        if (r) {
            if (!result)
                result = [];
            result = result.concat(r);
            index = i;
            continue;
        }
        if (pattern[index] === '|') {
            //console.log('     new option:', result, pattern[index],  pattern.substring(index + 1));
            break;
        }
        break;
    }
    //console.log('    options result:', result, 'next:', pattern[index]);
    // if (pattern[index] === '|') {
    //     index++;
    // }
    return [result, index];
}
exports.option = option;
function group(pattern, index, maxLength) {
    var _a;
    if (index === void 0) { index = 0; }
    if (maxLength === void 0) { maxLength = 10; }
    //console.log(' groups pattern:', index, pattern);
    if (pattern[index] !== '(') {
        //console.log(' groups result:', null, pattern[index]);
        return [null, index];
    }
    var offset = index;
    var _b = [null, 0], r = _b[0], i = _b[1];
    var result = null;
    var options = [];
    index++;
    while (index < pattern.length) {
        //console.log('  while group:', result, options, index, pattern[index]);
        _a = option(pattern, index), r = _a[0], i = _a[1];
        if (r) {
            options = options.concat(r);
            index = i;
            result = r;
            continue;
        }
        //console.log('  while group after option:', result, options, index, pattern[index]);
        if (pattern[index] == '|') {
            //console.log('     new group option:', result, pattern[index],  pattern.substring(index + 1));
            index++;
            continue;
        }
        if (pattern[index] !== ')') {
            //console.log(' groups result:', null, pattern[offset]);
            return [null, offset];
        }
        break;
    }
    if (pattern[index] !== ')') {
        return [null, offset];
    }
    result = (options.length > 0) ? options : null;
    index++;
    //console.log(' groups result:', result, pattern[index]);
    return [result, index];
}
exports.group = group;
function expression(pattern, index, maxLength) {
    //console.log('expression pattern:', index, pattern);
    var _a, _b;
    if (index === void 0) { index = 0; }
    if (maxLength === void 0) { maxLength = 10; }
    var _c = [null, 0], r = _c[0], i = _c[1];
    var result = null;
    var options = [];
    var startIndex = 0;
    while (index < pattern.length) {
        if (pattern[index] === '|') {
            startIndex = options.length;
            //log('------option |', options, startIndex);
            index++;
        }
        //console.log(' while expression1 before group:', 'result:', result, 'options:', options, pattern[index], startIndex);
        _a = group(pattern, index), r = _a[0], i = _a[1];
        if (r) {
            var lastOptions = options.filter(function (e, i, a) { return i >= startIndex; });
            //log('   expression group: r:', r, 'result:', result, 'options:', options, pattern[index], startIndex, 'lastOptions:',lastOptions);
            //remember index of start of options in group
            //startIndex = options.length;
            if (lastOptions.length === 0) {
                options = options.concat(r);
            }
            else {
                //log('   group buildVariants:', lastOptions, startIndex, options, r);
                options = buildVariants(lastOptions, r, maxLength);
            }
            index = i;
            result = r;
            continue;
        }
        //console.log(' expression before option:', result, options, pattern[index]);
        _b = option(pattern, index), r = _b[0], i = _b[1];
        if (r) {
            //console.log('expression option:', r);
            var lastOptions = options.filter(function (e, i, a) { return i >= startIndex; });
            //console.log('expression option/lastOptions:', lastOptions);
            if (lastOptions.length === 0) {
                options = options.concat(r);
            }
            else {
                //console.log('   option buildVariants:', lastOptions, startIndex, options);
                options = buildVariants(lastOptions, [r[0]], maxLength);
            }
            index = i;
            result = r;
            continue;
        }
        var c = pattern[index];
        //console.log('c', c);
        ;
        if ((c === '*' || c === '+' || c === '?') && result !== null) {
            //console.log('  expression * or +:', result);
            var lastOptions = options.filter(function (e, i, a) { return i >= startIndex; });
            var firstOptions = options.filter(function (e, i, a) { return i < startIndex; });
            if (c === '*' || c === '?') {
                lastOptions = lastOptions.map(function (o) { return o.substring(0, o.length - 1); });
            }
            //console.log('  buildVariants first & lastOptions:', firstOptions, lastOptions, options);
            var chars = result;
            chars.unshift('');
            while (lastOptions[lastOptions.length - 1].length < maxLength && lastOptions.length < MAX_OPTIONS_LENGTH) {
                //console.log('    buildVariants options:', options, result, maxLength, options[options.length - 1].length);
                lastOptions = buildVariants(lastOptions, chars, maxLength);
                if (c === '?') {
                    break;
                }
            }
            options = firstOptions.concat(lastOptions);
            index++;
            continue;
        }
        //must be handled otherwise break
        //console.log('no match:', i, pattern[i]);
        break;
    }
    result = options;
    //console.log('expression result:', result);
    index++;
    //console.log(' expression result:', result, 'rest:', pattern[index]);
    return [result, index];
}
exports.expression = expression;
function regexpPattern2typeAlias(pattern, base, attr) {
    var result = '';
    var maxInt = (attr && /\d+/.test(attr['maxInclusive'])) ? parseInt(attr['maxInclusive']) : undefined;
    var minInt = (attr && /\d+/.test(attr['minInclusive'])) ? parseInt(attr['minInclusive']) : undefined;
    var maxLength = (attr && /\d+/.test(attr['maxLength'])) ? parseInt(attr['maxLength']) : undefined;
    //console.log('maxLength:', maxLength);
    var _a = expression(pattern, 0, maxLength), v = _a[0], i = _a[1];
    if (!v) {
        return base;
    }
    var options = v || [];
    //console.log('alias options:', options);
    if (base === 'string') {
        result = options
            .filter(function (n) { return !maxLength || ('' + n).length <= maxLength; })
            .map(function (o) { return "\"" + o.replace('"', '\\"') + "\""; }).join('|');
        //log('string result :', result);
    }
    else if (base === 'number') {
        result = options
            .filter(function (o) { return /\d\.?\d*/.test(o); })
            //.map( o => {console.log(0);return o;})
            .map(function (s) { return +s; })
            .filter(function (n) { return !maxLength || ('' + n).length <= maxLength; })
            .filter(function (n) { return (!maxInt || n <= maxInt); })
            .filter(function (n) { return (!minInt || n >= minInt); })
            .filter(function (n, i, a) { return a.indexOf(n) === i; }) //ontdubbelen
            .join('|').replace(/\|+/g, '|');
    }
    else {
        result = base;
    }
    if (result.length > 500) {
        result = base;
    }
    xml_utils_1.log('alias result :', result);
    return result || base;
}
exports.regexpPattern2typeAlias = regexpPattern2typeAlias;
