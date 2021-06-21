/* This file contains a 36-line Javascript GEDCOM parser. It only
 * handles standard-conformant lines and has no error messages, but it
 * handles all of GEDCOM 7.0.0 structures including CONT, pointers, and
 * extension tags. Structure hierarchy is not validated, and hence
 * payload datatypes are not known nor handled.
 * 
 * Written by Luther Tychonievich, August 2020. Released to the public
 * domain, to be used freely for any purposed with or without
 * acknowledgement.
 */
function Structure(tag, ptr, str, ext) {
    this.type = tag in ext ? ext[tag] : tag;
    if (ptr) this.ptr = ptr;
    if (str) this.str = str;
    this.sub = [];
}
Structure.prototype.fixPtrs = function(ids) {
    if (this.ptr && this.ptr in ids) this.ptr = ids[this.ptr];
    this.sub.forEach(x => x.fixPtrs(ids));
    if (this.sub.length == 0) delete this.sub; // remove if empty
}
function parseGEDCOM(input) {
    var lre = /(0|[1-9][0-9]*) (?:@([A-Z0-9_]+)@ )?([A-Z0-9_]+)(?: (?:@([A-Z0-9_]+)@|((?:[^@\n\r]|@@)[^\n\r]*))| )?(?:\r\n?|\n\r?|$)/g;
    var context = [];
    var records = [];
    var ids = {};
    var ext = {};
    for(match of input.matchAll(lre)) {
        var level = Number(match[1]);
        if (match[3] == "CONT") {
            context[level-1].str += "\n" + match[5];
            continue;
        }
        var s = new Structure(match[3], match[4], match[5], ext)
        if (s.type == 'TAG' && context[0].type == 'HEAD' && context[1].type == 'SCHMA') {
            var tmp = s.str.split(/ (.*)/);
            ext[tmp[0]] = tmp[1];
        }
        context[level] = s;
        if (level > 0) context[level-1].sub.push(s);
        else records.push(s);
        if (match[2]) ids[match[2]] = s;
    }
    records.forEach(x => x.fixPtrs(ids));
    return records;
}

/* Example use:

let s = `0 HEAD
1 GEDC
2 VERS 7.0.0
1 SCHMA
2 TAG _FOO http://example.com/placeholder
0 @I1@ INDI
1 ALIA @I2@
1 _FOO 23
0 @I2@ INDI
1 NAME
2 PART Tom Jones
1 ASSO @I1@
2 TYPE GODP
0 TRLR`

let r = parseGEDCOM(s)
console.log(r)
*/
