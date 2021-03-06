var SockContext = (function () {
    function SockContext() {
    }
    Object.defineProperty(SockContext, "masterSock", {
        get: function () {
            return this._masterSock;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SockContext, "slaveSock", {
        get: function () {
            return this._slaveSock;
        },
        enumerable: true,
        configurable: true
    });
    SockContext.init = function () {
        if (this.didInit)
            return;
    };
    return SockContext;
}());
SockContext.didInit = false;
var Entrypoint = (function () {
    function Entrypoint() {
    }
    Entrypoint.initCheck = function () {
        var done = true;
        for (var i in this.initStatus)
            done = done && this.initStatus[i];
        if (done)
            Entrypoint.ready();
    };
    Entrypoint.start = function () {
        var _this = this;
        Key.init();
        FileCache.initCache(
        // SUCCESS 
        function () {
            _this.initStatus.fileCache = true;
            _this.initCheck();
        }, 
        // FAILURE
        function (error) {
            CriticalStop.redirect(error);
        });
    };
    Entrypoint.ready = function () {
    };
    return Entrypoint;
}());
Entrypoint.initStatus = {
    fileCache: false
};
var FileCache = (function () {
    function FileCache() {
    }
    FileCache.initCache = function (success, error) {
        var _this = this;
        var request = window.indexedDB.open("fileCache", 3);
        request.onupgradeneeded = function (event) {
            var db = event.target.result;
            if (db.objectStoreNames.contains("files"))
                db.deleteObjectStore("files");
            if (db.objectStoreNames.contains("metadata"))
                db.deleteObjectStore("metadata");
            if (db.objectStoreNames.contains("hashes"))
                db.deleteObjectStore("hashes");
            db.createObjectStore("files", { keyPath: "name", autoIncrement: false });
            db.createObjectStore("metadata", { keyPath: "name", autoIncrement: false });
        };
        request.onerror = function (event) {
            error("Could not upgrade the client database to the most recent version.");
        };
        request.onsuccess = function (event) {
            _this.dbHandle = request.result;
            success();
        };
    };
    FileCache.getMeta = function (fileName, success, error) {
        var query = this.dbHandle.transaction("metadata");
        var store = query.objectStore("metadata");
        var request = store.get(fileName);
        request.onsuccess = function () {
            success(request.result);
        };
        request.onerror = function (event) {
            error("Could not get metadata for file " + fileName);
        };
    };
    FileCache.setMeta = function (meta) {
        var query = this.dbHandle.transaction("metadata", "readwrite");
        var store = query.objectStore("metadata");
        store.put(meta);
    };
    FileCache.getFile = function (fileName, success, error) {
        var query = this.dbHandle.transaction("files");
        var store = query.objectStore("files");
        var request = store.get(fileName);
        request.onsuccess = function () {
            success(request.result.name, request.result.data);
        };
        request.onerror = function (event) {
            error("Could not get contents for file " + fileName);
        };
    };
    FileCache.setFile = function (fileName, data) {
        var query = this.dbHandle.transaction("files", "readwrite");
        var store = query.objectStore("files");
        store.put({ name: fileName, data: data });
    };
    FileCache.deleteFile = function (fileName) {
        var query = this.dbHandle.transaction("files", "readwrite");
        var store = query.objectStore("files");
        store.delete(fileName);
        store = query.objectStore("metadata");
        store.delete(fileName);
    };
    return FileCache;
}());
FileCache.dbHandle = null;
var FileMeta = (function () {
    function FileMeta() {
    }
    return FileMeta;
}());
var MasterProtocol = (function () {
    function MasterProtocol() {
    }
    Object.defineProperty(MasterProtocol, "packetHandlers", {
        get: function () {
            return [
                { id: 1, event: this.keyExchange }
            ];
        },
        enumerable: true,
        configurable: true
    });
    MasterProtocol.keyExchange = function (data, conn) {
        var response = Key.generateResponsePacket(data);
        if (Key.succeeded) {
            Cipher.init(Key.privateKey);
            conn.send(response);
        }
        else
            CriticalStop.redirect("Could not establish an encrypted connection with the server.");
    };
    MasterProtocol.loginAttempt = function (username, password) {
    };
    return MasterProtocol;
}());
var SlaveProtocol = (function () {
    function SlaveProtocol() {
    }
    Object.defineProperty(SlaveProtocol, "packetHandlers", {
        get: function () {
            return [
                { id: 1, event: this.userLoginResponse }
            ];
        },
        enumerable: true,
        configurable: true
    });
    SlaveProtocol.userLoginResponse = function (data, conn) {
        console.log("mario has logged in");
    };
    return SlaveProtocol;
}());
var Rendering = (function () {
    function Rendering() {
    }
    return Rendering;
}());
var Connection = (function () {
    function Connection(address, handles, useCipher, onOpen, onClose, onError) {
        if (useCipher === void 0) { useCipher = false; }
        if (onOpen === void 0) { onOpen = null; }
        if (onClose === void 0) { onClose = null; }
        if (onError === void 0) { onError = null; }
        var _this = this;
        this.sock = null;
        this._isOpen = false;
        this.handles = [];
        this.onOpenFunc = null;
        this.onCloseFunc = null;
        this.onErrorFunc = null;
        this.address = address;
        this.useCipher = useCipher;
        this.onOpenFunc = onOpen;
        this.onCloseFunc = onClose;
        this.onErrorFunc = onError;
        handles.forEach(function (element) {
            _this.handles[element.id] = element.event;
        });
    }
    Object.defineProperty(Connection.prototype, "isOpen", {
        get: function () {
            return this._isOpen;
        },
        enumerable: true,
        configurable: true
    });
    Connection.prototype.open = function () {
        if (this._isOpen)
            return;
        // FLAG replace hard coded url with one loaded from a config file
        this.sock = new WebSocket(this.address);
        this.sock.binaryType = "arraybuffer";
        this.sock.onopen = this.onOpen;
        this.sock.onmessage = this.onMessage;
        this.sock.onerror = this.onError;
        this.sock.onclose = this.onClose;
    };
    Connection.prototype.send = function (msg) {
        this.sock.send(msg.getBytes());
    };
    Connection.prototype.onOpen = function (event) {
        this._isOpen = true;
        if (this.onOpenFunc)
            this.onOpenFunc(this);
    };
    Connection.prototype.onMessage = function (event) {
        var raw = new Uint8Array(event.data);
        var msg;
        try {
            msg = !this.useCipher || !Cipher.ready ? Packet.fromBytes(raw)
                : Packet.fromBytes(Cipher.parse(raw));
        }
        catch (e) {
            close();
            return;
        }
        console.log(msg);
        if (msg.id < this.handles.length && this.handles[msg.id] !== undefined)
            this.handles[msg.id](msg, this);
        /*
        switch(msg.id) {
            case kMasterId.KeyExchange:
                break;
            case kMasterId.LoginAttempt:

                break;
            case kMasterId.RegistrationAttempt:

                break;
        }
        */
    };
    Connection.prototype.onError = function (event) {
        if (this.onErrorFunc)
            this.onErrorFunc(event, this);
    };
    Connection.prototype.onClose = function (event) {
        this._isOpen = false;
        Cipher.close();
        if (this.onCloseFunc)
            this.onCloseFunc(this);
    };
    Connection.prototype.close = function () {
        if (!this._isOpen)
            return;
        this.sock.close();
    };
    return Connection;
}());
var Key = (function () {
    function Key() {
    }
    Object.defineProperty(Key, "privateKey", {
        get: function () {
            return Key._privateKey;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Key, "succeeded", {
        get: function () {
            return !Key._privateKey.eq(new bigInt(0));
        },
        enumerable: true,
        configurable: true
    });
    Key.init = function () {
        Key.secret = Random.generatePrime(512);
    };
    Key.generateResponsePacket = function (request) {
        var generator = new bigInt(request[0].toString(), 16);
        var modulus = new bigInt(request[1].toString(), 16);
        var serverKey = new bigInt(request[2].toString(), 16);
        var clientKey = generator.modPow(Key.secret, modulus);
        Key._privateKey = serverKey.modPow(Key.secret, modulus);
        return Packet.create(1 /* KeyExchange */, [clientKey.toString(16)]);
    };
    return Key;
}());
Key._privateKey = new bigInt(0);
var Cipher = (function () {
    function Cipher() {
    }
    Object.defineProperty(Cipher, "ready", {
        get: function () {
            return Cipher._ready;
        },
        enumerable: true,
        configurable: true
    });
    Cipher.init = function (key) {
        Cipher.key = key.toByteArray(512 / 8);
        Cipher.state = new Uint8Array(256);
        for (var stateIndex = 0; stateIndex < Cipher.state.length; ++stateIndex)
            Cipher.state[stateIndex] = stateIndex;
        var i, j = 0, t;
        for (i = 0; i < 256; ++i) {
            j = (j + Cipher.state[i] + Cipher.key[i % Cipher.key.length]) % 256;
            t = Cipher.state[i];
            Cipher.state[i] = Cipher.state[j];
            Cipher.state[j] = t;
        }
        Cipher.generateStream(1024);
        Cipher._ready = true;
    };
    Cipher.generateStream = function (length) {
        var stream = new Uint8Array(length);
        var i = 0, j = 0, x, t;
        for (x = 0; x < length; ++x) {
            i = (i + 1) % 256;
            j = (j + Cipher.state[i]) % 256;
            t = Cipher.state[i];
            Cipher.state[i] = Cipher.state[j];
            Cipher.state[j] = t;
            stream[x] = Cipher.state[(Cipher.state[i] + Cipher.state[j]) % 256];
        }
        return stream;
    };
    Cipher.parse = function (data) {
        if (!Cipher._ready)
            return null;
        var stream = Cipher.generateStream(data.length);
        for (var i = 0; i < data.length; ++i)
            data[i] = data[i] ^ stream[i];
        return data;
    };
    Cipher.close = function () {
        Cipher._ready = false;
    };
    return Cipher;
}());
Cipher._ready = false;
var Packet = (function () {
    function Packet() {
        this._regions = [];
    }
    Object.defineProperty(Packet.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Packet.prototype, "regions", {
        get: function () {
            return this._regions;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Packet.prototype, "regionCount", {
        get: function () {
            return this._regions.length;
        },
        enumerable: true,
        configurable: true
    });
    Packet.prototype.getRegion = function (region) {
        return this._regions[region];
    };
    Packet.prototype.getRegionString = function (region) {
        return this.getRegion(region).toString();
    };
    Packet.prototype.addRegion = function (region) {
        if (typeof region == "string")
            this._regions.push(region.toByteArray());
        else if (region instanceof Uint8Array)
            this._regions.push(region);
        this[this.regionCount - 1] = this._regions[this.regionCount - 1];
        return this;
    };
    Packet.create = function (id, regions) {
        var packet = new Packet;
        packet._id = id;
        regions.forEach(function (region) {
            packet.addRegion(region);
        });
        return packet;
    };
    Packet.fromBytes = function (bytes) {
        var packet = new Packet;
        if (!bytes.subarray(0, 4).every(function (v, i) { return v === Packet.magicNumber[i]; }))
            return null;
        packet._id = bytes[4];
        var regionCount = bytes[5];
        var regionLengths = [];
        var ptr = 6;
        for (var i = 0; i < regionCount; ++i) {
            if (bytes[ptr] < 0xFE)
                regionLengths.push(bytes[ptr]);
            else if (bytes[ptr] == 0xFE) {
                regionLengths.push(bytes.unpackUint16(ptr + 1));
                ptr += 2;
            }
            else {
                regionLengths.push(bytes.unpackUint32(ptr + 1));
                ptr += 4;
            }
            ++ptr;
        }
        for (var i = 0; i < regionCount; ++i) {
            packet.addRegion(bytes.subarray(ptr, ptr + regionLengths[i]));
            ptr += regionLengths[i];
        }
        return packet;
    };
    Packet.prototype.getBytes = function () {
        var headerSize = 6, bodySize = 0;
        this._regions.forEach(function (region) {
            bodySize += region.byteLength;
            ++headerSize;
            if (region.byteLength >= 0xFE && region.byteLength <= 0xFFFF)
                headerSize += 2;
            else if (region.byteLength > 0xFFFF)
                headerSize += 4;
        });
        var buffer = new Uint8Array(headerSize + bodySize);
        var headerPtr = 6, bodyPtr = headerSize;
        buffer.set(Packet.magicNumber, 0);
        buffer[4] = this._id % 256;
        buffer[5] = this._regions.length;
        this._regions.forEach(function (region) {
            var regionLength = region.byteLength;
            if (regionLength < 0xFE)
                buffer[headerPtr] = regionLength;
            else if (regionLength >= 0xFE && regionLength <= 0xFFFF) {
                buffer[headerPtr] = 0xFE;
                buffer.set(regionLength.packUint16(), headerPtr + 1);
                headerPtr += 2;
            }
            else {
                buffer[headerPtr] = 0xFF;
                buffer.set(regionLength.packUint32(), headerPtr + 1);
                headerPtr += 4;
            }
            ++headerPtr;
            buffer.set(region, bodyPtr);
            bodyPtr += regionLength;
        });
        return buffer;
    };
    return Packet;
}());
Packet.magicNumber = new Uint8Array([0xF0, 0x9F, 0xA6, 0x91]);
// ** STRING EXTENSIONS ** \\
String.prototype.replaceAll = function (needle, replace, ignoreCase) {
    if (ignoreCase === void 0) { ignoreCase = false; }
    if ((typeof needle) == "string")
        return this.replace(new RegExp(needle.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignoreCase ? "gi" : "g")), (typeof (replace) == "string") ? replace.replace(/\$/g, "$$$$") : replace);
    else {
        var retval = this;
        for (var i in needle) {
            if ((typeof replace) == "string")
                retval = retval.replaceAll(needle[i], replace, ignoreCase);
            else
                retval = retval.replaceAll(needle[i], replace[i], ignoreCase);
        }
        return retval;
    }
};
String.prototype.contains = function (needle, ignoreCase) {
    if (ignoreCase === void 0) { ignoreCase = false; }
    return ignoreCase
        ? this.toLowerCase().indexOf(needle.toLowerCase()) != -1
        : this.indexOf(needle) != -1;
};
String.prototype.stripCharacters = function (chars) {
    var copy = this;
    if (chars != "")
        copy = copy.replaceAll(chars.split(""), "");
    return copy;
};
String.prototype.hasUnicodeCharacters = function () {
    for (var i = 0; i < this.length; i++) {
        if (this.charCodeAt(i) > 127)
            return true;
    }
    return false;
};
String.prototype.byteLength = function () {
    return utf8.encode(this).length;
};
String.prototype.toByteArray = function () {
    var str = utf8.encode(this);
    var ret = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++)
        ret[i] = str.charCodeAt(i);
    return ret;
};
Date.unixNow = function () {
    return (new Date).toUnixTime();
};
Date.prototype.toUnixTime = function () {
    return Math.floor(this.getTime() / 1000);
};
Number.prototype.zeroPad = function (mag) {
    if (mag === void 0) { mag = 1; }
    var ret = "" + this;
    for (; this < Math.pow(10, mag) && mag != 0; --mag)
        ret = "0" + ret;
    return ret;
};
Number.prototype.packInt16 = function () {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, this, false);
    return new Uint8Array(buffer);
};
Number.prototype.packUint16 = function () {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setUint16(0, this, false);
    return new Uint8Array(buffer);
};
Number.prototype.packInt32 = function () {
    var buffer = new ArrayBuffer(4);
    new DataView(buffer).setInt32(0, this, false);
    return new Uint8Array(buffer);
};
Number.prototype.packUint32 = function () {
    var buffer = new ArrayBuffer(4);
    new DataView(buffer).setUint32(0, this, false);
    return new Uint8Array(buffer);
};
Number.prototype.packFloat = function () {
    var buffer = new ArrayBuffer(4);
    new DataView(buffer).setFloat32(0, this, false);
    return new Uint8Array(buffer);
};
Number.prototype.packDouble = function () {
    var buffer = new ArrayBuffer(8);
    new DataView(buffer).setFloat64(0, this, false);
    return new Uint8Array(buffer);
};
Uint8Array.prototype.unpackInt16 = function (offset) {
    if (offset === void 0) { offset = 0; }
    var buffer = this.buffer;
    return new DataView(buffer).getInt16(offset, false);
};
Uint8Array.prototype.unpackUint16 = function (offset) {
    if (offset === void 0) { offset = 0; }
    var buffer = this.buffer;
    return new DataView(buffer).getUint16(offset, false);
};
Uint8Array.prototype.unpackInt32 = function (offset) {
    if (offset === void 0) { offset = 0; }
    var buffer = this.buffer;
    return new DataView(buffer).getInt32(offset, false);
};
Uint8Array.prototype.unpackUint32 = function (offset) {
    if (offset === void 0) { offset = 0; }
    var buffer = this.buffer;
    return new DataView(buffer).getUint32(offset, false);
};
Uint8Array.prototype.unpackFloat = function (offset) {
    if (offset === void 0) { offset = 0; }
    var buffer = this.buffer;
    return new DataView(buffer).getFloat32(offset, false);
};
Uint8Array.prototype.unpackDouble = function (offset) {
    if (offset === void 0) { offset = 0; }
    var buffer = this.buffer;
    return new DataView(buffer).getFloat64(offset, false);
};
Uint8Array.prototype.toString = function () {
    var chunkSize = 4096;
    var raw = "";
    for (var i = 0;; i++) {
        if (this.length < chunkSize * i)
            break;
        raw += String.fromCharCode.apply(null, this.subarray(chunkSize * i, chunkSize * i + chunkSize));
    }
    return utf8.decode(raw);
};
Uint8Array.prototype.toHexString = function () {
    var ret = "";
    for (var i = 0; i < this.byteLength; ++i) {
        var byte = this[i].toString(16);
        if (byte.length < 2)
            byte = "0" + byte;
        ret += byte + " ";
    }
    return ret.trim();
};
bigInt.prototype.toByteArray = function (byteCount) {
    var hexString = this.toString(16);
    var loopCount = Math.ceil(hexString.length / 2);
    var byteArray = new Uint8Array(byteCount);
    loopCount = Math.min(loopCount, byteCount);
    for (var i = 0; i < loopCount; ++i) {
        var byte = hexString.substring(Math.max(0, hexString.length - 2 * (i + 1)), hexString.length - 2 * i);
        byteArray[i] = parseInt(byte, 16);
    }
    return byteArray;
};
var CriticalStop = (function () {
    function CriticalStop() {
    }
    CriticalStop.redirect = function (message) {
        window.location.href = "error.html?txt=" + encodeURIComponent(message) + "&rterr";
    };
    return CriticalStop;
}());
var Random = (function () {
    function Random() {
    }
    Random.generatePrime = function (bitCount) {
        if (bitCount === void 0) { bitCount = 512; }
        var lower = new bigInt(2).pow(bitCount - 1);
        var upper = new bigInt(2).pow(bitCount).prev();
        var prime = new bigInt(4);
        while (!prime.isProbablePrime())
            prime = bigInt.randBetween(lower, upper);
        return prime;
    };
    return Random;
}());
