!function(a){function f(a){for(var e,f,b=[],c=0,d=a.length;c<d;)e=a.charCodeAt(c++),e>=55296&&e<=56319&&c<d?(f=a.charCodeAt(c++),56320==(64512&f)?b.push(((1023&e)<<10)+(1023&f)+65536):(b.push(e),c--)):b.push(e);return b}function g(a){for(var d,b=a.length,c=-1,f="";++c<b;)d=a[c],d>65535&&(d-=65536,f+=e(d>>>10&1023|55296),d=56320|1023&d),f+=e(d);return f}function h(a){if(a>=55296&&a<=57343)throw Error("Lone surrogate U+"+a.toString(16).toUpperCase()+" is not a scalar value")}function i(a,b){return e(a>>b&63|128)}function j(a){if(0==(4294967168&a))return e(a);var b="";return 0==(4294965248&a)?b=e(a>>6&31|192):0==(4294901760&a)?(h(a),b=e(a>>12&15|224),b+=i(a,6)):0==(4292870144&a)&&(b=e(a>>18&7|240),b+=i(a,12),b+=i(a,6)),b+=e(63&a|128)}function k(a){for(var e,b=f(a),c=b.length,d=-1,g="";++d<c;)e=b[d],g+=j(e);return g}function l(){if(p>=o)throw Error("Invalid byte index");var a=255&n[p];if(p++,128==(192&a))return 63&a;throw Error("Invalid continuation byte")}function m(){var a,b,c,d,e;if(p>o)throw Error("Invalid byte index");if(p==o)return!1;if(a=255&n[p],p++,0==(128&a))return a;if(192==(224&a)){var b=l();if((e=(31&a)<<6|b)>=128)return e;throw Error("Invalid continuation byte")}if(224==(240&a)){if(b=l(),c=l(),(e=(15&a)<<12|b<<6|c)>=2048)return h(e),e;throw Error("Invalid continuation byte")}if(240==(248&a)&&(b=l(),c=l(),d=l(),(e=(15&a)<<18|b<<12|c<<6|d)>=65536&&e<=1114111))return e;throw Error("Invalid UTF-8 detected")}function q(a){n=f(a),o=n.length,p=0;for(var c,b=[];!1!==(c=m());)b.push(c);return g(b)}var b="object"==typeof exports&&exports,c="object"==typeof module&&module&&module.exports==b&&module,d="object"==typeof global&&global;d.global!==d&&d.window!==d||(a=d);var n,o,p,e=String.fromCharCode,r={version:"2.0.0",encode:k,decode:q};if("function"==typeof define&&"object"==typeof define.amd&&define.amd)define(function(){return r});else if(b&&!b.nodeType)if(c)c.exports=r;else{var s={},t=s.hasOwnProperty;for(var u in r)t.call(r,u)&&(b[u]=r[u])}else a.utf8=r}(this);