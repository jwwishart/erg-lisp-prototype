var DEBUG = false;
// TODO unused
function isObject(thing) {
    return Object.prototype.toString.call(thing) === "[object Object]";
}
function isArray(it) {
    return Object.prototype.toString.call(it) === '[object Array]';
}
function isFunction(it) {
    return Object.prototype.toString.call(it) === '[object Function]';
}
