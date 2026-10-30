/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-mixed-operators, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars, default-case, jsdoc/require-param*/
import $protobuf from "protobufjs/minimal.js";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;
const $Object = $util.global.Object, $undefined = $util.global.undefined, $Error = $util.global.Error, $TypeError = $util.global.TypeError, $Number = $util.global.Number, $String = $util.global.String, $Boolean = $util.global.Boolean, $isFinite = $util.global.isFinite, $Array = $util.global.Array, $parseInt = $util.global.parseInt, $BigInt = $util.global.BigInt;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const spog = $root.spog = (() => {

    /**
     * Namespace spog.
     * @exports spog
     * @namespace
     */
    const spog = {};

    spog.ParamValue = (function() {

        /**
         * Properties of a ParamValue.
         * @typedef {Object} spog.ParamValue.$Properties
         * @property {number|null} [numberValue] ParamValue numberValue
         * @property {string|null} [stringValue] ParamValue stringValue
         * @property {boolean|null} [boolValue] ParamValue boolValue
         * @property {"numberValue"|"stringValue"|"boolValue"} [value] ParamValue value
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a ParamValue.
         * @memberof spog
         * @interface IParamValue
         * @augments spog.ParamValue.$Properties
         * @deprecated Use spog.ParamValue.$Properties instead.
         */

        /**
         * Narrowed shape of a ParamValue.
         * @typedef {{
         *   numberValue?: number|null;
         *   stringValue?: string|null;
         *   boolValue?: boolean|null;
         *   $unknowns?: Array.<Uint8Array>;
         * } & (
         *   ({ value?: undefined; numberValue?: null; stringValue?: null; boolValue?: null }|{ value?: "numberValue"; numberValue: number; stringValue?: null; boolValue?: null }|{ value?: "stringValue"; numberValue?: null; stringValue: string; boolValue?: null }|{ value?: "boolValue"; numberValue?: null; stringValue?: null; boolValue: boolean })
         * )} spog.ParamValue.$Shape
         */

        /**
         * Constructs a new ParamValue.
         * @memberof spog
         * @classdesc Represents a ParamValue.
         * @constructor
         * @param {spog.ParamValue.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const ParamValue = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * ParamValue numberValue.
         * @member {number|null|undefined} numberValue
         * @memberof spog.ParamValue
         * @instance
         */
        ParamValue.prototype.numberValue = null;

        /**
         * ParamValue stringValue.
         * @member {string|null|undefined} stringValue
         * @memberof spog.ParamValue
         * @instance
         */
        ParamValue.prototype.stringValue = null;

        /**
         * ParamValue boolValue.
         * @member {boolean|null|undefined} boolValue
         * @memberof spog.ParamValue
         * @instance
         */
        ParamValue.prototype.boolValue = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * ParamValue value.
         * @member {"numberValue"|"stringValue"|"boolValue"|undefined} value
         * @memberof spog.ParamValue
         * @instance
         */
        $Object.defineProperty(ParamValue.prototype, "value", {
            get: $util.oneOfGetter($oneOfFields = ["numberValue", "stringValue", "boolValue"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new ParamValue instance using the specified properties.
         * @function create
         * @memberof spog.ParamValue
         * @static
         * @param {spog.ParamValue.$Properties=} [properties] Properties to set
         * @returns {spog.ParamValue} ParamValue instance
         * @type {{
         *   (properties: spog.ParamValue.$Shape): spog.ParamValue & spog.ParamValue.$Shape;
         *   (properties?: spog.ParamValue.$Properties): spog.ParamValue;
         * }}
         */
        ParamValue.create = function(properties) {
            return new ParamValue(properties);
        };

        /**
         * Encodes the specified ParamValue message. Does not implicitly {@link spog.ParamValue.verify|verify} messages.
         * @function encode
         * @memberof spog.ParamValue
         * @static
         * @param {spog.ParamValue.$Properties} message ParamValue message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ParamValue.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.numberValue != null && $Object.hasOwnProperty.call(message, "numberValue"))
                writer.uint32(/* id 1, wireType 1 =*/9).double(message.numberValue);
            if (message.stringValue != null && $Object.hasOwnProperty.call(message, "stringValue"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.stringValue);
            if (message.boolValue != null && $Object.hasOwnProperty.call(message, "boolValue"))
                writer.uint32(/* id 3, wireType 0 =*/24).bool(message.boolValue);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified ParamValue message, length delimited. Does not implicitly {@link spog.ParamValue.verify|verify} messages.
         * @function encodeDelimited
         * @memberof spog.ParamValue
         * @static
         * @param {spog.ParamValue.$Properties} message ParamValue message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ParamValue.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a ParamValue message from the specified reader or buffer.
         * @function decode
         * @memberof spog.ParamValue
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {spog.ParamValue & spog.ParamValue.$Shape} ParamValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ParamValue.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.spog.ParamValue();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 1)
                            break;
                        message.numberValue = reader.double();
                        message.value = "numberValue";
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        message.stringValue = reader.stringVerify();
                        message.value = "stringValue";
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        message.boolValue = reader.bool();
                        message.value = "boolValue";
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a ParamValue message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof spog.ParamValue
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {spog.ParamValue & spog.ParamValue.$Shape} ParamValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ParamValue.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ParamValue message.
         * @function verify
         * @memberof spog.ParamValue
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ParamValue.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            let properties = {};
            if (message.numberValue != null && $Object.hasOwnProperty.call(message, "numberValue")) {
                properties.value = 1;
                if (typeof message.numberValue !== "number")
                    return "numberValue: number expected";
            }
            if (message.stringValue != null && $Object.hasOwnProperty.call(message, "stringValue")) {
                if (properties.value === 1)
                    return "value: multiple values";
                properties.value = 1;
                if (!$util.isString(message.stringValue))
                    return "stringValue: string expected";
            }
            if (message.boolValue != null && $Object.hasOwnProperty.call(message, "boolValue")) {
                if (properties.value === 1)
                    return "value: multiple values";
                properties.value = 1;
                if (typeof message.boolValue !== "boolean")
                    return "boolValue: boolean expected";
            }
            return null;
        };

        /**
         * Creates a ParamValue message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof spog.ParamValue
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {spog.ParamValue} ParamValue
         */
        ParamValue.fromObject = function (object, _depth) {
            if (object instanceof $root.spog.ParamValue)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".spog.ParamValue: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.spog.ParamValue();
            if (object.numberValue != null)
                message.numberValue = $Number(object.numberValue);
            if (object.stringValue != null)
                message.stringValue = $String(object.stringValue);
            if (object.boolValue != null)
                message.boolValue = $Boolean(object.boolValue);
            return message;
        };

        /**
         * Creates a plain object from a ParamValue message. Also converts values to other types if specified.
         * @function toObject
         * @memberof spog.ParamValue
         * @static
         * @param {spog.ParamValue} message ParamValue
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ParamValue.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (message.numberValue != null && $Object.hasOwnProperty.call(message, "numberValue")) {
                object.numberValue = options.json && !$isFinite(message.numberValue) ? $String(message.numberValue) : message.numberValue;
                if (options.oneofs)
                    object.value = "numberValue";
            }
            if (message.stringValue != null && $Object.hasOwnProperty.call(message, "stringValue")) {
                object.stringValue = message.stringValue;
                if (options.oneofs)
                    object.value = "stringValue";
            }
            if (message.boolValue != null && $Object.hasOwnProperty.call(message, "boolValue")) {
                object.boolValue = message.boolValue;
                if (options.oneofs)
                    object.value = "boolValue";
            }
            return object;
        };

        /**
         * Converts this ParamValue to JSON.
         * @function toJSON
         * @memberof spog.ParamValue
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ParamValue.prototype.toJSON = function() {
            return ParamValue.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for ParamValue
         * @function getTypeUrl
         * @memberof spog.ParamValue
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        ParamValue.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/spog.ParamValue";
        };

        return ParamValue;
    })();

    spog.ValueMsg = (function() {

        /**
         * Properties of a ValueMsg.
         * @typedef {Object} spog.ValueMsg.$Properties
         * @property {spog.ParamValue.$Properties|null} [value] ValueMsg value
         * @property {number|null} [ts] ValueMsg ts
         * @property {string|null} [fullId] ValueMsg fullId
         * @property {Array.<string>|null} [valueList] ValueMsg valueList
         * @property {number|null} [originId] ValueMsg originId
         * @property {number|Long|null} [tsMs] ValueMsg tsMs
         * @property {number|null} [seat] ValueMsg seat
         * @property {string|null} [label] ValueMsg label
         * @property {Array.<number>|null} [xpShared] ValueMsg xpShared
         * @property {Array.<string>|null} [xpSuffix] ValueMsg xpSuffix
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a ValueMsg.
         * @memberof spog
         * @interface IValueMsg
         * @augments spog.ValueMsg.$Properties
         * @deprecated Use spog.ValueMsg.$Properties instead.
         */

        /**
         * Shape of a ValueMsg.
         * @typedef {{
         *   value?: spog.ParamValue.$Shape|null;
         *   ts?: number|null;
         *   fullId?: string|null;
         *   valueList?: Array.<string>|null;
         *   originId?: number|null;
         *   tsMs?: number|Long|null;
         *   seat?: number|null;
         *   label?: string|null;
         *   xpShared?: Array.<number>|null;
         *   xpSuffix?: Array.<string>|null;
         *   $unknowns?: Array.<Uint8Array>;
         * }} spog.ValueMsg.$Shape
         */

        /**
         * Constructs a new ValueMsg.
         * @memberof spog
         * @classdesc Represents a ValueMsg.
         * @constructor
         * @param {spog.ValueMsg.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const ValueMsg = function (properties) {
            this.valueList = [];
            this.xpShared = [];
            this.xpSuffix = [];
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * ValueMsg value.
         * @member {spog.ParamValue.$Properties|null|undefined} value
         * @memberof spog.ValueMsg
         * @instance
         */
        ValueMsg.prototype.value = null;

        /**
         * ValueMsg ts.
         * @member {number} ts
         * @memberof spog.ValueMsg
         * @instance
         */
        ValueMsg.prototype.ts = 0;

        /**
         * ValueMsg fullId.
         * @member {string} fullId
         * @memberof spog.ValueMsg
         * @instance
         */
        ValueMsg.prototype.fullId = "";

        /**
         * ValueMsg valueList.
         * @member {Array.<string>} valueList
         * @memberof spog.ValueMsg
         * @instance
         */
        ValueMsg.prototype.valueList = $util.emptyArray;

        /**
         * ValueMsg originId.
         * @member {number} originId
         * @memberof spog.ValueMsg
         * @instance
         */
        ValueMsg.prototype.originId = 0;

        /**
         * ValueMsg tsMs.
         * @member {number|Long} tsMs
         * @memberof spog.ValueMsg
         * @instance
         */
        ValueMsg.prototype.tsMs = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * ValueMsg seat.
         * @member {number} seat
         * @memberof spog.ValueMsg
         * @instance
         */
        ValueMsg.prototype.seat = 0;

        /**
         * ValueMsg label.
         * @member {string} label
         * @memberof spog.ValueMsg
         * @instance
         */
        ValueMsg.prototype.label = "";

        /**
         * ValueMsg xpShared.
         * @member {Array.<number>} xpShared
         * @memberof spog.ValueMsg
         * @instance
         */
        ValueMsg.prototype.xpShared = $util.emptyArray;

        /**
         * ValueMsg xpSuffix.
         * @member {Array.<string>} xpSuffix
         * @memberof spog.ValueMsg
         * @instance
         */
        ValueMsg.prototype.xpSuffix = $util.emptyArray;

        /**
         * Creates a new ValueMsg instance using the specified properties.
         * @function create
         * @memberof spog.ValueMsg
         * @static
         * @param {spog.ValueMsg.$Properties=} [properties] Properties to set
         * @returns {spog.ValueMsg} ValueMsg instance
         * @type {{
         *   (properties: spog.ValueMsg.$Shape): spog.ValueMsg & spog.ValueMsg.$Shape;
         *   (properties?: spog.ValueMsg.$Properties): spog.ValueMsg;
         * }}
         */
        ValueMsg.create = function(properties) {
            return new ValueMsg(properties);
        };

        /**
         * Encodes the specified ValueMsg message. Does not implicitly {@link spog.ValueMsg.verify|verify} messages.
         * @function encode
         * @memberof spog.ValueMsg
         * @static
         * @param {spog.ValueMsg.$Properties} message ValueMsg message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ValueMsg.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.value != null && $Object.hasOwnProperty.call(message, "value"))
                $root.spog.ParamValue.encode(message.value, writer.uint32(/* id 1, wireType 2 =*/10).fork(), _depth + 1).ldelim();
            if (message.ts != null && $Object.hasOwnProperty.call(message, "ts") && !$Object.is(message.ts, 0))
                writer.uint32(/* id 2, wireType 1 =*/17).double(message.ts);
            if (message.fullId != null && $Object.hasOwnProperty.call(message, "fullId") && message.fullId !== "")
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.fullId);
            if (message.valueList != null && message.valueList.length)
                for (let i = 0; i < message.valueList.length; ++i)
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.valueList[i]);
            if (message.originId != null && $Object.hasOwnProperty.call(message, "originId") && message.originId !== 0)
                writer.uint32(/* id 5, wireType 5 =*/45).fixed32(message.originId);
            if (message.tsMs != null && $Object.hasOwnProperty.call(message, "tsMs") && (typeof message.tsMs === "object" ? message.tsMs.low || message.tsMs.high : message.tsMs !== 0))
                writer.uint32(/* id 6, wireType 0 =*/48).uint64(message.tsMs);
            if (message.seat != null && $Object.hasOwnProperty.call(message, "seat") && message.seat !== 0)
                writer.uint32(/* id 7, wireType 0 =*/56).uint32(message.seat);
            if (message.label != null && $Object.hasOwnProperty.call(message, "label") && message.label !== "")
                writer.uint32(/* id 8, wireType 2 =*/66).string(message.label);
            if (message.xpShared != null && message.xpShared.length)
                writer.uint32(/* id 9, wireType 2 =*/74).uint32s(message.xpShared);
            if (message.xpSuffix != null && message.xpSuffix.length)
                for (let i = 0; i < message.xpSuffix.length; ++i)
                    writer.uint32(/* id 10, wireType 2 =*/82).string(message.xpSuffix[i]);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified ValueMsg message, length delimited. Does not implicitly {@link spog.ValueMsg.verify|verify} messages.
         * @function encodeDelimited
         * @memberof spog.ValueMsg
         * @static
         * @param {spog.ValueMsg.$Properties} message ValueMsg message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ValueMsg.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a ValueMsg message from the specified reader or buffer.
         * @function decode
         * @memberof spog.ValueMsg
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {spog.ValueMsg & spog.ValueMsg.$Shape} ValueMsg
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ValueMsg.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.spog.ValueMsg(), value;
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        message.value = $root.spog.ParamValue.decode(reader, reader.uint32(), $undefined, _depth + 1, message.value);
                        continue;
                    }
                case 2: {
                        if (wireType !== 1)
                            break;
                        if (!$Object.is(value = reader.double(), 0))
                            message.ts = value;
                        else
                            delete message.ts;
                        continue;
                    }
                case 3: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.fullId = value;
                        else
                            delete message.fullId;
                        continue;
                    }
                case 4: {
                        if (wireType !== 2)
                            break;
                        if (!(message.valueList && message.valueList.length))
                            message.valueList = [];
                        message.valueList.push(reader.stringVerify());
                        continue;
                    }
                case 5: {
                        if (wireType !== 5)
                            break;
                        if (value = reader.fixed32())
                            message.originId = value;
                        else
                            delete message.originId;
                        continue;
                    }
                case 6: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.tsMs = value;
                        else
                            delete message.tsMs;
                        continue;
                    }
                case 7: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.uint32())
                            message.seat = value;
                        else
                            delete message.seat;
                        continue;
                    }
                case 8: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.label = value;
                        else
                            delete message.label;
                        continue;
                    }
                case 9: {
                        if (wireType === 2) {
                            if (!(message.xpShared && message.xpShared.length))
                                message.xpShared = [];
                            reader.uint32s(message.xpShared);
                            continue;
                        }
                        if (wireType !== 0)
                            break;
                        if (!(message.xpShared && message.xpShared.length))
                            message.xpShared = [];
                        message.xpShared.push(reader.uint32());
                        continue;
                    }
                case 10: {
                        if (wireType !== 2)
                            break;
                        if (!(message.xpSuffix && message.xpSuffix.length))
                            message.xpSuffix = [];
                        message.xpSuffix.push(reader.stringVerify());
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a ValueMsg message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof spog.ValueMsg
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {spog.ValueMsg & spog.ValueMsg.$Shape} ValueMsg
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ValueMsg.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ValueMsg message.
         * @function verify
         * @memberof spog.ValueMsg
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ValueMsg.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.value != null && $Object.hasOwnProperty.call(message, "value")) {
                let error = $root.spog.ParamValue.verify(message.value, _depth + 1);
                if (error)
                    return "value." + error;
            }
            if (message.ts != null && $Object.hasOwnProperty.call(message, "ts"))
                if (typeof message.ts !== "number")
                    return "ts: number expected";
            if (message.fullId != null && $Object.hasOwnProperty.call(message, "fullId"))
                if (!$util.isString(message.fullId))
                    return "fullId: string expected";
            if (message.valueList != null && $Object.hasOwnProperty.call(message, "valueList")) {
                if (!$Array.isArray(message.valueList))
                    return "valueList: array expected";
                for (let i = 0; i < message.valueList.length; ++i)
                    if (!$util.isString(message.valueList[i]))
                        return "valueList: string[] expected";
            }
            if (message.originId != null && $Object.hasOwnProperty.call(message, "originId"))
                if (!$util.isInteger(message.originId))
                    return "originId: integer expected";
            if (message.tsMs != null && $Object.hasOwnProperty.call(message, "tsMs"))
                if (!$util.isInteger(message.tsMs) && !(message.tsMs && $util.isInteger(message.tsMs.low) && $util.isInteger(message.tsMs.high)))
                    return "tsMs: integer|Long expected";
            if (message.seat != null && $Object.hasOwnProperty.call(message, "seat"))
                if (!$util.isInteger(message.seat))
                    return "seat: integer expected";
            if (message.label != null && $Object.hasOwnProperty.call(message, "label"))
                if (!$util.isString(message.label))
                    return "label: string expected";
            if (message.xpShared != null && $Object.hasOwnProperty.call(message, "xpShared")) {
                if (!$Array.isArray(message.xpShared))
                    return "xpShared: array expected";
                for (let i = 0; i < message.xpShared.length; ++i)
                    if (!$util.isInteger(message.xpShared[i]))
                        return "xpShared: integer[] expected";
            }
            if (message.xpSuffix != null && $Object.hasOwnProperty.call(message, "xpSuffix")) {
                if (!$Array.isArray(message.xpSuffix))
                    return "xpSuffix: array expected";
                for (let i = 0; i < message.xpSuffix.length; ++i)
                    if (!$util.isString(message.xpSuffix[i]))
                        return "xpSuffix: string[] expected";
            }
            return null;
        };

        /**
         * Creates a ValueMsg message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof spog.ValueMsg
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {spog.ValueMsg} ValueMsg
         */
        ValueMsg.fromObject = function (object, _depth) {
            if (object instanceof $root.spog.ValueMsg)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".spog.ValueMsg: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.spog.ValueMsg();
            if (object.value != null) {
                if (!$util.isObject(object.value))
                    throw $TypeError(".spog.ValueMsg.value: object expected");
                message.value = $root.spog.ParamValue.fromObject(object.value, _depth + 1);
            }
            if (object.ts != null)
                if (!$Object.is($Number(object.ts), 0))
                    message.ts = $Number(object.ts);
            if (object.fullId != null)
                if (typeof object.fullId !== "string" || object.fullId.length)
                    message.fullId = $String(object.fullId);
            if (object.valueList) {
                if (!$Array.isArray(object.valueList))
                    throw $TypeError(".spog.ValueMsg.valueList: array expected");
                message.valueList = $Array(object.valueList.length);
                for (let i = 0; i < object.valueList.length; ++i)
                    message.valueList[i] = $String(object.valueList[i]);
            }
            if (object.originId != null)
                if ($Number(object.originId) !== 0)
                    message.originId = object.originId >>> 0;
            if (object.tsMs != null)
                if (typeof object.tsMs === "object" ? object.tsMs.low || object.tsMs.high : $Number(object.tsMs) !== 0)
                    if ($util.Long)
                        message.tsMs = $util.Long.fromValue(object.tsMs, true);
                    else if (typeof object.tsMs === "string")
                        message.tsMs = $parseInt(object.tsMs, 10);
                    else if (typeof object.tsMs === "number")
                        message.tsMs = object.tsMs;
                    else if (typeof object.tsMs === "object")
                        message.tsMs = new $util.LongBits(object.tsMs.low >>> 0, object.tsMs.high >>> 0).toNumber(true);
            if (object.seat != null)
                if ($Number(object.seat) !== 0)
                    message.seat = object.seat >>> 0;
            if (object.label != null)
                if (typeof object.label !== "string" || object.label.length)
                    message.label = $String(object.label);
            if (object.xpShared) {
                if (!$Array.isArray(object.xpShared))
                    throw $TypeError(".spog.ValueMsg.xpShared: array expected");
                message.xpShared = $Array(object.xpShared.length);
                for (let i = 0; i < object.xpShared.length; ++i)
                    message.xpShared[i] = object.xpShared[i] >>> 0;
            }
            if (object.xpSuffix) {
                if (!$Array.isArray(object.xpSuffix))
                    throw $TypeError(".spog.ValueMsg.xpSuffix: array expected");
                message.xpSuffix = $Array(object.xpSuffix.length);
                for (let i = 0; i < object.xpSuffix.length; ++i)
                    message.xpSuffix[i] = $String(object.xpSuffix[i]);
            }
            return message;
        };

        /**
         * Creates a plain object from a ValueMsg message. Also converts values to other types if specified.
         * @function toObject
         * @memberof spog.ValueMsg
         * @static
         * @param {spog.ValueMsg} message ValueMsg
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ValueMsg.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.arrays || options.defaults) {
                object.valueList = [];
                object.xpShared = [];
                object.xpSuffix = [];
            }
            if (options.defaults) {
                object.value = null;
                object.ts = 0;
                object.fullId = "";
                object.originId = 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.tsMs = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.tsMs = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                object.seat = 0;
                object.label = "";
            }
            if (message.value != null && $Object.hasOwnProperty.call(message, "value"))
                object.value = $root.spog.ParamValue.toObject(message.value, options, _depth + 1);
            if (message.ts != null && $Object.hasOwnProperty.call(message, "ts"))
                object.ts = options.json && !$isFinite(message.ts) ? $String(message.ts) : message.ts;
            if (message.fullId != null && $Object.hasOwnProperty.call(message, "fullId"))
                object.fullId = message.fullId;
            if (message.valueList && message.valueList.length) {
                object.valueList = $Array(message.valueList.length);
                for (let j = 0; j < message.valueList.length; ++j)
                    object.valueList[j] = message.valueList[j];
            }
            if (message.originId != null && $Object.hasOwnProperty.call(message, "originId"))
                object.originId = message.originId;
            if (message.tsMs != null && $Object.hasOwnProperty.call(message, "tsMs"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.tsMs = typeof message.tsMs === "number" ? $BigInt(message.tsMs) : $util.Long.fromBits(message.tsMs.low >>> 0, message.tsMs.high >>> 0, true).toBigInt();
                else if (typeof message.tsMs === "number")
                    object.tsMs = options.longs === $String ? $String(message.tsMs) : message.tsMs;
                else
                    object.tsMs = options.longs === $String ? $util.Long.prototype.toString.call(message.tsMs) : options.longs === $Number ? new $util.LongBits(message.tsMs.low >>> 0, message.tsMs.high >>> 0).toNumber(true) : message.tsMs;
            if (message.seat != null && $Object.hasOwnProperty.call(message, "seat"))
                object.seat = message.seat;
            if (message.label != null && $Object.hasOwnProperty.call(message, "label"))
                object.label = message.label;
            if (message.xpShared && message.xpShared.length) {
                object.xpShared = $Array(message.xpShared.length);
                for (let j = 0; j < message.xpShared.length; ++j)
                    object.xpShared[j] = message.xpShared[j];
            }
            if (message.xpSuffix && message.xpSuffix.length) {
                object.xpSuffix = $Array(message.xpSuffix.length);
                for (let j = 0; j < message.xpSuffix.length; ++j)
                    object.xpSuffix[j] = message.xpSuffix[j];
            }
            return object;
        };

        /**
         * Converts this ValueMsg to JSON.
         * @function toJSON
         * @memberof spog.ValueMsg
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ValueMsg.prototype.toJSON = function() {
            return ValueMsg.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for ValueMsg
         * @function getTypeUrl
         * @memberof spog.ValueMsg
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        ValueMsg.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/spog.ValueMsg";
        };

        return ValueMsg;
    })();

    spog.LogMsg = (function() {

        /**
         * Properties of a LogMsg.
         * @typedef {Object} spog.LogMsg.$Properties
         * @property {number|null} [voyage] LogMsg voyage
         * @property {number|null} [entry] LogMsg entry
         * @property {number|Long|null} [tsMs] LogMsg tsMs
         * @property {string|null} [dest] LogMsg dest
         * @property {string|null} [prod] LogMsg prod
         * @property {Array.<string>|null} [added] LogMsg added
         * @property {Array.<string>|null} [removed] LogMsg removed
         * @property {string|null} [text] LogMsg text
         * @property {string|null} [by] LogMsg by
         * @property {string|null} [role] LogMsg role
         * @property {boolean|null} [reversed] LogMsg reversed
         * @property {string|null} [reversedBy] LogMsg reversedBy
         * @property {number|Long|null} [reversedTs] LogMsg reversedTs
         * @property {number|null} [originId] LogMsg originId
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a LogMsg.
         * @memberof spog
         * @interface ILogMsg
         * @augments spog.LogMsg.$Properties
         * @deprecated Use spog.LogMsg.$Properties instead.
         */

        /**
         * Shape of a LogMsg.
         * @typedef {spog.LogMsg.$Properties} spog.LogMsg.$Shape
         */

        /**
         * Constructs a new LogMsg.
         * @memberof spog
         * @classdesc Represents a LogMsg.
         * @constructor
         * @param {spog.LogMsg.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const LogMsg = function (properties) {
            this.added = [];
            this.removed = [];
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * LogMsg voyage.
         * @member {number} voyage
         * @memberof spog.LogMsg
         * @instance
         */
        LogMsg.prototype.voyage = 0;

        /**
         * LogMsg entry.
         * @member {number} entry
         * @memberof spog.LogMsg
         * @instance
         */
        LogMsg.prototype.entry = 0;

        /**
         * LogMsg tsMs.
         * @member {number|Long} tsMs
         * @memberof spog.LogMsg
         * @instance
         */
        LogMsg.prototype.tsMs = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * LogMsg dest.
         * @member {string} dest
         * @memberof spog.LogMsg
         * @instance
         */
        LogMsg.prototype.dest = "";

        /**
         * LogMsg prod.
         * @member {string} prod
         * @memberof spog.LogMsg
         * @instance
         */
        LogMsg.prototype.prod = "";

        /**
         * LogMsg added.
         * @member {Array.<string>} added
         * @memberof spog.LogMsg
         * @instance
         */
        LogMsg.prototype.added = $util.emptyArray;

        /**
         * LogMsg removed.
         * @member {Array.<string>} removed
         * @memberof spog.LogMsg
         * @instance
         */
        LogMsg.prototype.removed = $util.emptyArray;

        /**
         * LogMsg text.
         * @member {string} text
         * @memberof spog.LogMsg
         * @instance
         */
        LogMsg.prototype.text = "";

        /**
         * LogMsg by.
         * @member {string} by
         * @memberof spog.LogMsg
         * @instance
         */
        LogMsg.prototype.by = "";

        /**
         * LogMsg role.
         * @member {string} role
         * @memberof spog.LogMsg
         * @instance
         */
        LogMsg.prototype.role = "";

        /**
         * LogMsg reversed.
         * @member {boolean} reversed
         * @memberof spog.LogMsg
         * @instance
         */
        LogMsg.prototype.reversed = false;

        /**
         * LogMsg reversedBy.
         * @member {string} reversedBy
         * @memberof spog.LogMsg
         * @instance
         */
        LogMsg.prototype.reversedBy = "";

        /**
         * LogMsg reversedTs.
         * @member {number|Long} reversedTs
         * @memberof spog.LogMsg
         * @instance
         */
        LogMsg.prototype.reversedTs = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * LogMsg originId.
         * @member {number} originId
         * @memberof spog.LogMsg
         * @instance
         */
        LogMsg.prototype.originId = 0;

        /**
         * Creates a new LogMsg instance using the specified properties.
         * @function create
         * @memberof spog.LogMsg
         * @static
         * @param {spog.LogMsg.$Properties=} [properties] Properties to set
         * @returns {spog.LogMsg} LogMsg instance
         * @type {{
         *   (properties: spog.LogMsg.$Shape): spog.LogMsg & spog.LogMsg.$Shape;
         *   (properties?: spog.LogMsg.$Properties): spog.LogMsg;
         * }}
         */
        LogMsg.create = function(properties) {
            return new LogMsg(properties);
        };

        /**
         * Encodes the specified LogMsg message. Does not implicitly {@link spog.LogMsg.verify|verify} messages.
         * @function encode
         * @memberof spog.LogMsg
         * @static
         * @param {spog.LogMsg.$Properties} message LogMsg message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LogMsg.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.voyage != null && $Object.hasOwnProperty.call(message, "voyage") && message.voyage !== 0)
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.voyage);
            if (message.entry != null && $Object.hasOwnProperty.call(message, "entry") && message.entry !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.entry);
            if (message.tsMs != null && $Object.hasOwnProperty.call(message, "tsMs") && (typeof message.tsMs === "object" ? message.tsMs.low || message.tsMs.high : message.tsMs !== 0))
                writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.tsMs);
            if (message.dest != null && $Object.hasOwnProperty.call(message, "dest") && message.dest !== "")
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.dest);
            if (message.prod != null && $Object.hasOwnProperty.call(message, "prod") && message.prod !== "")
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.prod);
            if (message.added != null && message.added.length)
                for (let i = 0; i < message.added.length; ++i)
                    writer.uint32(/* id 6, wireType 2 =*/50).string(message.added[i]);
            if (message.removed != null && message.removed.length)
                for (let i = 0; i < message.removed.length; ++i)
                    writer.uint32(/* id 7, wireType 2 =*/58).string(message.removed[i]);
            if (message.text != null && $Object.hasOwnProperty.call(message, "text") && message.text !== "")
                writer.uint32(/* id 8, wireType 2 =*/66).string(message.text);
            if (message.by != null && $Object.hasOwnProperty.call(message, "by") && message.by !== "")
                writer.uint32(/* id 9, wireType 2 =*/74).string(message.by);
            if (message.role != null && $Object.hasOwnProperty.call(message, "role") && message.role !== "")
                writer.uint32(/* id 10, wireType 2 =*/82).string(message.role);
            if (message.reversed != null && $Object.hasOwnProperty.call(message, "reversed") && message.reversed !== false)
                writer.uint32(/* id 11, wireType 0 =*/88).bool(message.reversed);
            if (message.reversedBy != null && $Object.hasOwnProperty.call(message, "reversedBy") && message.reversedBy !== "")
                writer.uint32(/* id 12, wireType 2 =*/98).string(message.reversedBy);
            if (message.reversedTs != null && $Object.hasOwnProperty.call(message, "reversedTs") && (typeof message.reversedTs === "object" ? message.reversedTs.low || message.reversedTs.high : message.reversedTs !== 0))
                writer.uint32(/* id 13, wireType 0 =*/104).uint64(message.reversedTs);
            if (message.originId != null && $Object.hasOwnProperty.call(message, "originId") && message.originId !== 0)
                writer.uint32(/* id 14, wireType 5 =*/117).fixed32(message.originId);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified LogMsg message, length delimited. Does not implicitly {@link spog.LogMsg.verify|verify} messages.
         * @function encodeDelimited
         * @memberof spog.LogMsg
         * @static
         * @param {spog.LogMsg.$Properties} message LogMsg message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LogMsg.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a LogMsg message from the specified reader or buffer.
         * @function decode
         * @memberof spog.LogMsg
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {spog.LogMsg & spog.LogMsg.$Shape} LogMsg
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LogMsg.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.spog.LogMsg(), value;
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.uint32())
                            message.voyage = value;
                        else
                            delete message.voyage;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.uint32())
                            message.entry = value;
                        else
                            delete message.entry;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.tsMs = value;
                        else
                            delete message.tsMs;
                        continue;
                    }
                case 4: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.dest = value;
                        else
                            delete message.dest;
                        continue;
                    }
                case 5: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.prod = value;
                        else
                            delete message.prod;
                        continue;
                    }
                case 6: {
                        if (wireType !== 2)
                            break;
                        if (!(message.added && message.added.length))
                            message.added = [];
                        message.added.push(reader.stringVerify());
                        continue;
                    }
                case 7: {
                        if (wireType !== 2)
                            break;
                        if (!(message.removed && message.removed.length))
                            message.removed = [];
                        message.removed.push(reader.stringVerify());
                        continue;
                    }
                case 8: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.text = value;
                        else
                            delete message.text;
                        continue;
                    }
                case 9: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.by = value;
                        else
                            delete message.by;
                        continue;
                    }
                case 10: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.role = value;
                        else
                            delete message.role;
                        continue;
                    }
                case 11: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.reversed = value;
                        else
                            delete message.reversed;
                        continue;
                    }
                case 12: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.reversedBy = value;
                        else
                            delete message.reversedBy;
                        continue;
                    }
                case 13: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.reversedTs = value;
                        else
                            delete message.reversedTs;
                        continue;
                    }
                case 14: {
                        if (wireType !== 5)
                            break;
                        if (value = reader.fixed32())
                            message.originId = value;
                        else
                            delete message.originId;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a LogMsg message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof spog.LogMsg
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {spog.LogMsg & spog.LogMsg.$Shape} LogMsg
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LogMsg.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a LogMsg message.
         * @function verify
         * @memberof spog.LogMsg
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        LogMsg.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.voyage != null && $Object.hasOwnProperty.call(message, "voyage"))
                if (!$util.isInteger(message.voyage))
                    return "voyage: integer expected";
            if (message.entry != null && $Object.hasOwnProperty.call(message, "entry"))
                if (!$util.isInteger(message.entry))
                    return "entry: integer expected";
            if (message.tsMs != null && $Object.hasOwnProperty.call(message, "tsMs"))
                if (!$util.isInteger(message.tsMs) && !(message.tsMs && $util.isInteger(message.tsMs.low) && $util.isInteger(message.tsMs.high)))
                    return "tsMs: integer|Long expected";
            if (message.dest != null && $Object.hasOwnProperty.call(message, "dest"))
                if (!$util.isString(message.dest))
                    return "dest: string expected";
            if (message.prod != null && $Object.hasOwnProperty.call(message, "prod"))
                if (!$util.isString(message.prod))
                    return "prod: string expected";
            if (message.added != null && $Object.hasOwnProperty.call(message, "added")) {
                if (!$Array.isArray(message.added))
                    return "added: array expected";
                for (let i = 0; i < message.added.length; ++i)
                    if (!$util.isString(message.added[i]))
                        return "added: string[] expected";
            }
            if (message.removed != null && $Object.hasOwnProperty.call(message, "removed")) {
                if (!$Array.isArray(message.removed))
                    return "removed: array expected";
                for (let i = 0; i < message.removed.length; ++i)
                    if (!$util.isString(message.removed[i]))
                        return "removed: string[] expected";
            }
            if (message.text != null && $Object.hasOwnProperty.call(message, "text"))
                if (!$util.isString(message.text))
                    return "text: string expected";
            if (message.by != null && $Object.hasOwnProperty.call(message, "by"))
                if (!$util.isString(message.by))
                    return "by: string expected";
            if (message.role != null && $Object.hasOwnProperty.call(message, "role"))
                if (!$util.isString(message.role))
                    return "role: string expected";
            if (message.reversed != null && $Object.hasOwnProperty.call(message, "reversed"))
                if (typeof message.reversed !== "boolean")
                    return "reversed: boolean expected";
            if (message.reversedBy != null && $Object.hasOwnProperty.call(message, "reversedBy"))
                if (!$util.isString(message.reversedBy))
                    return "reversedBy: string expected";
            if (message.reversedTs != null && $Object.hasOwnProperty.call(message, "reversedTs"))
                if (!$util.isInteger(message.reversedTs) && !(message.reversedTs && $util.isInteger(message.reversedTs.low) && $util.isInteger(message.reversedTs.high)))
                    return "reversedTs: integer|Long expected";
            if (message.originId != null && $Object.hasOwnProperty.call(message, "originId"))
                if (!$util.isInteger(message.originId))
                    return "originId: integer expected";
            return null;
        };

        /**
         * Creates a LogMsg message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof spog.LogMsg
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {spog.LogMsg} LogMsg
         */
        LogMsg.fromObject = function (object, _depth) {
            if (object instanceof $root.spog.LogMsg)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".spog.LogMsg: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.spog.LogMsg();
            if (object.voyage != null)
                if ($Number(object.voyage) !== 0)
                    message.voyage = object.voyage >>> 0;
            if (object.entry != null)
                if ($Number(object.entry) !== 0)
                    message.entry = object.entry >>> 0;
            if (object.tsMs != null)
                if (typeof object.tsMs === "object" ? object.tsMs.low || object.tsMs.high : $Number(object.tsMs) !== 0)
                    if ($util.Long)
                        message.tsMs = $util.Long.fromValue(object.tsMs, true);
                    else if (typeof object.tsMs === "string")
                        message.tsMs = $parseInt(object.tsMs, 10);
                    else if (typeof object.tsMs === "number")
                        message.tsMs = object.tsMs;
                    else if (typeof object.tsMs === "object")
                        message.tsMs = new $util.LongBits(object.tsMs.low >>> 0, object.tsMs.high >>> 0).toNumber(true);
            if (object.dest != null)
                if (typeof object.dest !== "string" || object.dest.length)
                    message.dest = $String(object.dest);
            if (object.prod != null)
                if (typeof object.prod !== "string" || object.prod.length)
                    message.prod = $String(object.prod);
            if (object.added) {
                if (!$Array.isArray(object.added))
                    throw $TypeError(".spog.LogMsg.added: array expected");
                message.added = $Array(object.added.length);
                for (let i = 0; i < object.added.length; ++i)
                    message.added[i] = $String(object.added[i]);
            }
            if (object.removed) {
                if (!$Array.isArray(object.removed))
                    throw $TypeError(".spog.LogMsg.removed: array expected");
                message.removed = $Array(object.removed.length);
                for (let i = 0; i < object.removed.length; ++i)
                    message.removed[i] = $String(object.removed[i]);
            }
            if (object.text != null)
                if (typeof object.text !== "string" || object.text.length)
                    message.text = $String(object.text);
            if (object.by != null)
                if (typeof object.by !== "string" || object.by.length)
                    message.by = $String(object.by);
            if (object.role != null)
                if (typeof object.role !== "string" || object.role.length)
                    message.role = $String(object.role);
            if (object.reversed != null)
                if (object.reversed)
                    message.reversed = $Boolean(object.reversed);
            if (object.reversedBy != null)
                if (typeof object.reversedBy !== "string" || object.reversedBy.length)
                    message.reversedBy = $String(object.reversedBy);
            if (object.reversedTs != null)
                if (typeof object.reversedTs === "object" ? object.reversedTs.low || object.reversedTs.high : $Number(object.reversedTs) !== 0)
                    if ($util.Long)
                        message.reversedTs = $util.Long.fromValue(object.reversedTs, true);
                    else if (typeof object.reversedTs === "string")
                        message.reversedTs = $parseInt(object.reversedTs, 10);
                    else if (typeof object.reversedTs === "number")
                        message.reversedTs = object.reversedTs;
                    else if (typeof object.reversedTs === "object")
                        message.reversedTs = new $util.LongBits(object.reversedTs.low >>> 0, object.reversedTs.high >>> 0).toNumber(true);
            if (object.originId != null)
                if ($Number(object.originId) !== 0)
                    message.originId = object.originId >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a LogMsg message. Also converts values to other types if specified.
         * @function toObject
         * @memberof spog.LogMsg
         * @static
         * @param {spog.LogMsg} message LogMsg
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        LogMsg.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.arrays || options.defaults) {
                object.added = [];
                object.removed = [];
            }
            if (options.defaults) {
                object.voyage = 0;
                object.entry = 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.tsMs = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.tsMs = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                object.dest = "";
                object.prod = "";
                object.text = "";
                object.by = "";
                object.role = "";
                object.reversed = false;
                object.reversedBy = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.reversedTs = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.reversedTs = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                object.originId = 0;
            }
            if (message.voyage != null && $Object.hasOwnProperty.call(message, "voyage"))
                object.voyage = message.voyage;
            if (message.entry != null && $Object.hasOwnProperty.call(message, "entry"))
                object.entry = message.entry;
            if (message.tsMs != null && $Object.hasOwnProperty.call(message, "tsMs"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.tsMs = typeof message.tsMs === "number" ? $BigInt(message.tsMs) : $util.Long.fromBits(message.tsMs.low >>> 0, message.tsMs.high >>> 0, true).toBigInt();
                else if (typeof message.tsMs === "number")
                    object.tsMs = options.longs === $String ? $String(message.tsMs) : message.tsMs;
                else
                    object.tsMs = options.longs === $String ? $util.Long.prototype.toString.call(message.tsMs) : options.longs === $Number ? new $util.LongBits(message.tsMs.low >>> 0, message.tsMs.high >>> 0).toNumber(true) : message.tsMs;
            if (message.dest != null && $Object.hasOwnProperty.call(message, "dest"))
                object.dest = message.dest;
            if (message.prod != null && $Object.hasOwnProperty.call(message, "prod"))
                object.prod = message.prod;
            if (message.added && message.added.length) {
                object.added = $Array(message.added.length);
                for (let j = 0; j < message.added.length; ++j)
                    object.added[j] = message.added[j];
            }
            if (message.removed && message.removed.length) {
                object.removed = $Array(message.removed.length);
                for (let j = 0; j < message.removed.length; ++j)
                    object.removed[j] = message.removed[j];
            }
            if (message.text != null && $Object.hasOwnProperty.call(message, "text"))
                object.text = message.text;
            if (message.by != null && $Object.hasOwnProperty.call(message, "by"))
                object.by = message.by;
            if (message.role != null && $Object.hasOwnProperty.call(message, "role"))
                object.role = message.role;
            if (message.reversed != null && $Object.hasOwnProperty.call(message, "reversed"))
                object.reversed = message.reversed;
            if (message.reversedBy != null && $Object.hasOwnProperty.call(message, "reversedBy"))
                object.reversedBy = message.reversedBy;
            if (message.reversedTs != null && $Object.hasOwnProperty.call(message, "reversedTs"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.reversedTs = typeof message.reversedTs === "number" ? $BigInt(message.reversedTs) : $util.Long.fromBits(message.reversedTs.low >>> 0, message.reversedTs.high >>> 0, true).toBigInt();
                else if (typeof message.reversedTs === "number")
                    object.reversedTs = options.longs === $String ? $String(message.reversedTs) : message.reversedTs;
                else
                    object.reversedTs = options.longs === $String ? $util.Long.prototype.toString.call(message.reversedTs) : options.longs === $Number ? new $util.LongBits(message.reversedTs.low >>> 0, message.reversedTs.high >>> 0).toNumber(true) : message.reversedTs;
            if (message.originId != null && $Object.hasOwnProperty.call(message, "originId"))
                object.originId = message.originId;
            return object;
        };

        /**
         * Converts this LogMsg to JSON.
         * @function toJSON
         * @memberof spog.LogMsg
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        LogMsg.prototype.toJSON = function() {
            return LogMsg.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for LogMsg
         * @function getTypeUrl
         * @memberof spog.LogMsg
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        LogMsg.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/spog.LogMsg";
        };

        return LogMsg;
    })();

    spog.PresenceMsg = (function() {

        /**
         * Properties of a PresenceMsg.
         * @typedef {Object} spog.PresenceMsg.$Properties
         * @property {boolean|null} [active] PresenceMsg active
         * @property {string|null} [fullId] PresenceMsg fullId
         * @property {number|null} [ts] PresenceMsg ts
         * @property {number|null} [originId] PresenceMsg originId
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a PresenceMsg.
         * @memberof spog
         * @interface IPresenceMsg
         * @augments spog.PresenceMsg.$Properties
         * @deprecated Use spog.PresenceMsg.$Properties instead.
         */

        /**
         * Shape of a PresenceMsg.
         * @typedef {spog.PresenceMsg.$Properties} spog.PresenceMsg.$Shape
         */

        /**
         * Constructs a new PresenceMsg.
         * @memberof spog
         * @classdesc Represents a PresenceMsg.
         * @constructor
         * @param {spog.PresenceMsg.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const PresenceMsg = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * PresenceMsg active.
         * @member {boolean} active
         * @memberof spog.PresenceMsg
         * @instance
         */
        PresenceMsg.prototype.active = false;

        /**
         * PresenceMsg fullId.
         * @member {string} fullId
         * @memberof spog.PresenceMsg
         * @instance
         */
        PresenceMsg.prototype.fullId = "";

        /**
         * PresenceMsg ts.
         * @member {number} ts
         * @memberof spog.PresenceMsg
         * @instance
         */
        PresenceMsg.prototype.ts = 0;

        /**
         * PresenceMsg originId.
         * @member {number} originId
         * @memberof spog.PresenceMsg
         * @instance
         */
        PresenceMsg.prototype.originId = 0;

        /**
         * Creates a new PresenceMsg instance using the specified properties.
         * @function create
         * @memberof spog.PresenceMsg
         * @static
         * @param {spog.PresenceMsg.$Properties=} [properties] Properties to set
         * @returns {spog.PresenceMsg} PresenceMsg instance
         * @type {{
         *   (properties: spog.PresenceMsg.$Shape): spog.PresenceMsg & spog.PresenceMsg.$Shape;
         *   (properties?: spog.PresenceMsg.$Properties): spog.PresenceMsg;
         * }}
         */
        PresenceMsg.create = function(properties) {
            return new PresenceMsg(properties);
        };

        /**
         * Encodes the specified PresenceMsg message. Does not implicitly {@link spog.PresenceMsg.verify|verify} messages.
         * @function encode
         * @memberof spog.PresenceMsg
         * @static
         * @param {spog.PresenceMsg.$Properties} message PresenceMsg message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PresenceMsg.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.active != null && $Object.hasOwnProperty.call(message, "active") && message.active !== false)
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.active);
            if (message.fullId != null && $Object.hasOwnProperty.call(message, "fullId") && message.fullId !== "")
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.fullId);
            if (message.ts != null && $Object.hasOwnProperty.call(message, "ts") && !$Object.is(message.ts, 0))
                writer.uint32(/* id 3, wireType 1 =*/25).double(message.ts);
            if (message.originId != null && $Object.hasOwnProperty.call(message, "originId") && message.originId !== 0)
                writer.uint32(/* id 4, wireType 5 =*/37).fixed32(message.originId);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified PresenceMsg message, length delimited. Does not implicitly {@link spog.PresenceMsg.verify|verify} messages.
         * @function encodeDelimited
         * @memberof spog.PresenceMsg
         * @static
         * @param {spog.PresenceMsg.$Properties} message PresenceMsg message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PresenceMsg.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a PresenceMsg message from the specified reader or buffer.
         * @function decode
         * @memberof spog.PresenceMsg
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {spog.PresenceMsg & spog.PresenceMsg.$Shape} PresenceMsg
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PresenceMsg.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.spog.PresenceMsg(), value;
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.active = value;
                        else
                            delete message.active;
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.fullId = value;
                        else
                            delete message.fullId;
                        continue;
                    }
                case 3: {
                        if (wireType !== 1)
                            break;
                        if (!$Object.is(value = reader.double(), 0))
                            message.ts = value;
                        else
                            delete message.ts;
                        continue;
                    }
                case 4: {
                        if (wireType !== 5)
                            break;
                        if (value = reader.fixed32())
                            message.originId = value;
                        else
                            delete message.originId;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a PresenceMsg message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof spog.PresenceMsg
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {spog.PresenceMsg & spog.PresenceMsg.$Shape} PresenceMsg
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PresenceMsg.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PresenceMsg message.
         * @function verify
         * @memberof spog.PresenceMsg
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PresenceMsg.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.active != null && $Object.hasOwnProperty.call(message, "active"))
                if (typeof message.active !== "boolean")
                    return "active: boolean expected";
            if (message.fullId != null && $Object.hasOwnProperty.call(message, "fullId"))
                if (!$util.isString(message.fullId))
                    return "fullId: string expected";
            if (message.ts != null && $Object.hasOwnProperty.call(message, "ts"))
                if (typeof message.ts !== "number")
                    return "ts: number expected";
            if (message.originId != null && $Object.hasOwnProperty.call(message, "originId"))
                if (!$util.isInteger(message.originId))
                    return "originId: integer expected";
            return null;
        };

        /**
         * Creates a PresenceMsg message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof spog.PresenceMsg
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {spog.PresenceMsg} PresenceMsg
         */
        PresenceMsg.fromObject = function (object, _depth) {
            if (object instanceof $root.spog.PresenceMsg)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".spog.PresenceMsg: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.spog.PresenceMsg();
            if (object.active != null)
                if (object.active)
                    message.active = $Boolean(object.active);
            if (object.fullId != null)
                if (typeof object.fullId !== "string" || object.fullId.length)
                    message.fullId = $String(object.fullId);
            if (object.ts != null)
                if (!$Object.is($Number(object.ts), 0))
                    message.ts = $Number(object.ts);
            if (object.originId != null)
                if ($Number(object.originId) !== 0)
                    message.originId = object.originId >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a PresenceMsg message. Also converts values to other types if specified.
         * @function toObject
         * @memberof spog.PresenceMsg
         * @static
         * @param {spog.PresenceMsg} message PresenceMsg
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PresenceMsg.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.active = false;
                object.fullId = "";
                object.ts = 0;
                object.originId = 0;
            }
            if (message.active != null && $Object.hasOwnProperty.call(message, "active"))
                object.active = message.active;
            if (message.fullId != null && $Object.hasOwnProperty.call(message, "fullId"))
                object.fullId = message.fullId;
            if (message.ts != null && $Object.hasOwnProperty.call(message, "ts"))
                object.ts = options.json && !$isFinite(message.ts) ? $String(message.ts) : message.ts;
            if (message.originId != null && $Object.hasOwnProperty.call(message, "originId"))
                object.originId = message.originId;
            return object;
        };

        /**
         * Converts this PresenceMsg to JSON.
         * @function toJSON
         * @memberof spog.PresenceMsg
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PresenceMsg.prototype.toJSON = function() {
            return PresenceMsg.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for PresenceMsg
         * @function getTypeUrl
         * @memberof spog.PresenceMsg
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        PresenceMsg.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/spog.PresenceMsg";
        };

        return PresenceMsg;
    })();

    spog.RateMsg = (function() {

        /**
         * Properties of a RateMsg.
         * @typedef {Object} spog.RateMsg.$Properties
         * @property {number|null} [messagesPerMinute] RateMsg messagesPerMinute
         * @property {number|null} [ts] RateMsg ts
         * @property {string|null} [fullId] RateMsg fullId
         * @property {number|null} [originId] RateMsg originId
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a RateMsg.
         * @memberof spog
         * @interface IRateMsg
         * @augments spog.RateMsg.$Properties
         * @deprecated Use spog.RateMsg.$Properties instead.
         */

        /**
         * Shape of a RateMsg.
         * @typedef {spog.RateMsg.$Properties} spog.RateMsg.$Shape
         */

        /**
         * Constructs a new RateMsg.
         * @memberof spog
         * @classdesc Represents a RateMsg.
         * @constructor
         * @param {spog.RateMsg.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const RateMsg = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * RateMsg messagesPerMinute.
         * @member {number} messagesPerMinute
         * @memberof spog.RateMsg
         * @instance
         */
        RateMsg.prototype.messagesPerMinute = 0;

        /**
         * RateMsg ts.
         * @member {number} ts
         * @memberof spog.RateMsg
         * @instance
         */
        RateMsg.prototype.ts = 0;

        /**
         * RateMsg fullId.
         * @member {string} fullId
         * @memberof spog.RateMsg
         * @instance
         */
        RateMsg.prototype.fullId = "";

        /**
         * RateMsg originId.
         * @member {number} originId
         * @memberof spog.RateMsg
         * @instance
         */
        RateMsg.prototype.originId = 0;

        /**
         * Creates a new RateMsg instance using the specified properties.
         * @function create
         * @memberof spog.RateMsg
         * @static
         * @param {spog.RateMsg.$Properties=} [properties] Properties to set
         * @returns {spog.RateMsg} RateMsg instance
         * @type {{
         *   (properties: spog.RateMsg.$Shape): spog.RateMsg & spog.RateMsg.$Shape;
         *   (properties?: spog.RateMsg.$Properties): spog.RateMsg;
         * }}
         */
        RateMsg.create = function(properties) {
            return new RateMsg(properties);
        };

        /**
         * Encodes the specified RateMsg message. Does not implicitly {@link spog.RateMsg.verify|verify} messages.
         * @function encode
         * @memberof spog.RateMsg
         * @static
         * @param {spog.RateMsg.$Properties} message RateMsg message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RateMsg.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.messagesPerMinute != null && $Object.hasOwnProperty.call(message, "messagesPerMinute") && message.messagesPerMinute !== 0)
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.messagesPerMinute);
            if (message.ts != null && $Object.hasOwnProperty.call(message, "ts") && !$Object.is(message.ts, 0))
                writer.uint32(/* id 2, wireType 1 =*/17).double(message.ts);
            if (message.fullId != null && $Object.hasOwnProperty.call(message, "fullId") && message.fullId !== "")
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.fullId);
            if (message.originId != null && $Object.hasOwnProperty.call(message, "originId") && message.originId !== 0)
                writer.uint32(/* id 4, wireType 5 =*/37).fixed32(message.originId);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified RateMsg message, length delimited. Does not implicitly {@link spog.RateMsg.verify|verify} messages.
         * @function encodeDelimited
         * @memberof spog.RateMsg
         * @static
         * @param {spog.RateMsg.$Properties} message RateMsg message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RateMsg.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a RateMsg message from the specified reader or buffer.
         * @function decode
         * @memberof spog.RateMsg
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {spog.RateMsg & spog.RateMsg.$Shape} RateMsg
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RateMsg.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.spog.RateMsg(), value;
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.messagesPerMinute = value;
                        else
                            delete message.messagesPerMinute;
                        continue;
                    }
                case 2: {
                        if (wireType !== 1)
                            break;
                        if (!$Object.is(value = reader.double(), 0))
                            message.ts = value;
                        else
                            delete message.ts;
                        continue;
                    }
                case 3: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.fullId = value;
                        else
                            delete message.fullId;
                        continue;
                    }
                case 4: {
                        if (wireType !== 5)
                            break;
                        if (value = reader.fixed32())
                            message.originId = value;
                        else
                            delete message.originId;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a RateMsg message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof spog.RateMsg
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {spog.RateMsg & spog.RateMsg.$Shape} RateMsg
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RateMsg.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RateMsg message.
         * @function verify
         * @memberof spog.RateMsg
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RateMsg.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.messagesPerMinute != null && $Object.hasOwnProperty.call(message, "messagesPerMinute"))
                if (!$util.isInteger(message.messagesPerMinute))
                    return "messagesPerMinute: integer expected";
            if (message.ts != null && $Object.hasOwnProperty.call(message, "ts"))
                if (typeof message.ts !== "number")
                    return "ts: number expected";
            if (message.fullId != null && $Object.hasOwnProperty.call(message, "fullId"))
                if (!$util.isString(message.fullId))
                    return "fullId: string expected";
            if (message.originId != null && $Object.hasOwnProperty.call(message, "originId"))
                if (!$util.isInteger(message.originId))
                    return "originId: integer expected";
            return null;
        };

        /**
         * Creates a RateMsg message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof spog.RateMsg
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {spog.RateMsg} RateMsg
         */
        RateMsg.fromObject = function (object, _depth) {
            if (object instanceof $root.spog.RateMsg)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".spog.RateMsg: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.spog.RateMsg();
            if (object.messagesPerMinute != null)
                if ($Number(object.messagesPerMinute) !== 0)
                    message.messagesPerMinute = object.messagesPerMinute | 0;
            if (object.ts != null)
                if (!$Object.is($Number(object.ts), 0))
                    message.ts = $Number(object.ts);
            if (object.fullId != null)
                if (typeof object.fullId !== "string" || object.fullId.length)
                    message.fullId = $String(object.fullId);
            if (object.originId != null)
                if ($Number(object.originId) !== 0)
                    message.originId = object.originId >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a RateMsg message. Also converts values to other types if specified.
         * @function toObject
         * @memberof spog.RateMsg
         * @static
         * @param {spog.RateMsg} message RateMsg
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RateMsg.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.messagesPerMinute = 0;
                object.ts = 0;
                object.fullId = "";
                object.originId = 0;
            }
            if (message.messagesPerMinute != null && $Object.hasOwnProperty.call(message, "messagesPerMinute"))
                object.messagesPerMinute = message.messagesPerMinute;
            if (message.ts != null && $Object.hasOwnProperty.call(message, "ts"))
                object.ts = options.json && !$isFinite(message.ts) ? $String(message.ts) : message.ts;
            if (message.fullId != null && $Object.hasOwnProperty.call(message, "fullId"))
                object.fullId = message.fullId;
            if (message.originId != null && $Object.hasOwnProperty.call(message, "originId"))
                object.originId = message.originId;
            return object;
        };

        /**
         * Converts this RateMsg to JSON.
         * @function toJSON
         * @memberof spog.RateMsg
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RateMsg.prototype.toJSON = function() {
            return RateMsg.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for RateMsg
         * @function getTypeUrl
         * @memberof spog.RateMsg
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        RateMsg.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/spog.RateMsg";
        };

        return RateMsg;
    })();

    spog.PayloadWrapper = (function() {

        /**
         * Properties of a PayloadWrapper.
         * @typedef {Object} spog.PayloadWrapper.$Properties
         * @property {spog.ValueMsg.$Properties|null} [valueMsg] PayloadWrapper valueMsg
         * @property {spog.PresenceMsg.$Properties|null} [presenceMsg] PayloadWrapper presenceMsg
         * @property {spog.RateMsg.$Properties|null} [rateMsg] PayloadWrapper rateMsg
         * @property {string|null} [jsonFallback] PayloadWrapper jsonFallback
         * @property {spog.LogMsg.$Properties|null} [logMsg] PayloadWrapper logMsg
         * @property {"valueMsg"|"presenceMsg"|"rateMsg"|"jsonFallback"|"logMsg"} [payload] PayloadWrapper payload
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a PayloadWrapper.
         * @memberof spog
         * @interface IPayloadWrapper
         * @augments spog.PayloadWrapper.$Properties
         * @deprecated Use spog.PayloadWrapper.$Properties instead.
         */

        /**
         * Narrowed shape of a PayloadWrapper.
         * @typedef {{
         *   valueMsg?: spog.ValueMsg.$Shape|null;
         *   presenceMsg?: spog.PresenceMsg.$Shape|null;
         *   rateMsg?: spog.RateMsg.$Shape|null;
         *   jsonFallback?: string|null;
         *   logMsg?: spog.LogMsg.$Shape|null;
         *   $unknowns?: Array.<Uint8Array>;
         * } & (
         *   ({ payload?: undefined; valueMsg?: null; presenceMsg?: null; rateMsg?: null; jsonFallback?: null; logMsg?: null }|{ payload?: "valueMsg"; valueMsg: spog.ValueMsg.$Shape; presenceMsg?: null; rateMsg?: null; jsonFallback?: null; logMsg?: null }|{ payload?: "presenceMsg"; valueMsg?: null; presenceMsg: spog.PresenceMsg.$Shape; rateMsg?: null; jsonFallback?: null; logMsg?: null }|{ payload?: "rateMsg"; valueMsg?: null; presenceMsg?: null; rateMsg: spog.RateMsg.$Shape; jsonFallback?: null; logMsg?: null }|{ payload?: "jsonFallback"; valueMsg?: null; presenceMsg?: null; rateMsg?: null; jsonFallback: string; logMsg?: null }|{ payload?: "logMsg"; valueMsg?: null; presenceMsg?: null; rateMsg?: null; jsonFallback?: null; logMsg: spog.LogMsg.$Shape })
         * )} spog.PayloadWrapper.$Shape
         */

        /**
         * Constructs a new PayloadWrapper.
         * @memberof spog
         * @classdesc Represents a PayloadWrapper.
         * @constructor
         * @param {spog.PayloadWrapper.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const PayloadWrapper = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * PayloadWrapper valueMsg.
         * @member {spog.ValueMsg.$Properties|null|undefined} valueMsg
         * @memberof spog.PayloadWrapper
         * @instance
         */
        PayloadWrapper.prototype.valueMsg = null;

        /**
         * PayloadWrapper presenceMsg.
         * @member {spog.PresenceMsg.$Properties|null|undefined} presenceMsg
         * @memberof spog.PayloadWrapper
         * @instance
         */
        PayloadWrapper.prototype.presenceMsg = null;

        /**
         * PayloadWrapper rateMsg.
         * @member {spog.RateMsg.$Properties|null|undefined} rateMsg
         * @memberof spog.PayloadWrapper
         * @instance
         */
        PayloadWrapper.prototype.rateMsg = null;

        /**
         * PayloadWrapper jsonFallback.
         * @member {string|null|undefined} jsonFallback
         * @memberof spog.PayloadWrapper
         * @instance
         */
        PayloadWrapper.prototype.jsonFallback = null;

        /**
         * PayloadWrapper logMsg.
         * @member {spog.LogMsg.$Properties|null|undefined} logMsg
         * @memberof spog.PayloadWrapper
         * @instance
         */
        PayloadWrapper.prototype.logMsg = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * PayloadWrapper payload.
         * @member {"valueMsg"|"presenceMsg"|"rateMsg"|"jsonFallback"|"logMsg"|undefined} payload
         * @memberof spog.PayloadWrapper
         * @instance
         */
        $Object.defineProperty(PayloadWrapper.prototype, "payload", {
            get: $util.oneOfGetter($oneOfFields = ["valueMsg", "presenceMsg", "rateMsg", "jsonFallback", "logMsg"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new PayloadWrapper instance using the specified properties.
         * @function create
         * @memberof spog.PayloadWrapper
         * @static
         * @param {spog.PayloadWrapper.$Properties=} [properties] Properties to set
         * @returns {spog.PayloadWrapper} PayloadWrapper instance
         * @type {{
         *   (properties: spog.PayloadWrapper.$Shape): spog.PayloadWrapper & spog.PayloadWrapper.$Shape;
         *   (properties?: spog.PayloadWrapper.$Properties): spog.PayloadWrapper;
         * }}
         */
        PayloadWrapper.create = function(properties) {
            return new PayloadWrapper(properties);
        };

        /**
         * Encodes the specified PayloadWrapper message. Does not implicitly {@link spog.PayloadWrapper.verify|verify} messages.
         * @function encode
         * @memberof spog.PayloadWrapper
         * @static
         * @param {spog.PayloadWrapper.$Properties} message PayloadWrapper message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PayloadWrapper.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.valueMsg != null && $Object.hasOwnProperty.call(message, "valueMsg"))
                $root.spog.ValueMsg.encode(message.valueMsg, writer.uint32(/* id 1, wireType 2 =*/10).fork(), _depth + 1).ldelim();
            if (message.presenceMsg != null && $Object.hasOwnProperty.call(message, "presenceMsg"))
                $root.spog.PresenceMsg.encode(message.presenceMsg, writer.uint32(/* id 2, wireType 2 =*/18).fork(), _depth + 1).ldelim();
            if (message.rateMsg != null && $Object.hasOwnProperty.call(message, "rateMsg"))
                $root.spog.RateMsg.encode(message.rateMsg, writer.uint32(/* id 3, wireType 2 =*/26).fork(), _depth + 1).ldelim();
            if (message.jsonFallback != null && $Object.hasOwnProperty.call(message, "jsonFallback"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.jsonFallback);
            if (message.logMsg != null && $Object.hasOwnProperty.call(message, "logMsg"))
                $root.spog.LogMsg.encode(message.logMsg, writer.uint32(/* id 5, wireType 2 =*/42).fork(), _depth + 1).ldelim();
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified PayloadWrapper message, length delimited. Does not implicitly {@link spog.PayloadWrapper.verify|verify} messages.
         * @function encodeDelimited
         * @memberof spog.PayloadWrapper
         * @static
         * @param {spog.PayloadWrapper.$Properties} message PayloadWrapper message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PayloadWrapper.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a PayloadWrapper message from the specified reader or buffer.
         * @function decode
         * @memberof spog.PayloadWrapper
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {spog.PayloadWrapper & spog.PayloadWrapper.$Shape} PayloadWrapper
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PayloadWrapper.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.spog.PayloadWrapper();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        message.valueMsg = $root.spog.ValueMsg.decode(reader, reader.uint32(), $undefined, _depth + 1, message.valueMsg);
                        message.payload = "valueMsg";
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        message.presenceMsg = $root.spog.PresenceMsg.decode(reader, reader.uint32(), $undefined, _depth + 1, message.presenceMsg);
                        message.payload = "presenceMsg";
                        continue;
                    }
                case 3: {
                        if (wireType !== 2)
                            break;
                        message.rateMsg = $root.spog.RateMsg.decode(reader, reader.uint32(), $undefined, _depth + 1, message.rateMsg);
                        message.payload = "rateMsg";
                        continue;
                    }
                case 4: {
                        if (wireType !== 2)
                            break;
                        message.jsonFallback = reader.stringVerify();
                        message.payload = "jsonFallback";
                        continue;
                    }
                case 5: {
                        if (wireType !== 2)
                            break;
                        message.logMsg = $root.spog.LogMsg.decode(reader, reader.uint32(), $undefined, _depth + 1, message.logMsg);
                        message.payload = "logMsg";
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a PayloadWrapper message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof spog.PayloadWrapper
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {spog.PayloadWrapper & spog.PayloadWrapper.$Shape} PayloadWrapper
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PayloadWrapper.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PayloadWrapper message.
         * @function verify
         * @memberof spog.PayloadWrapper
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PayloadWrapper.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            let properties = {};
            if (message.valueMsg != null && $Object.hasOwnProperty.call(message, "valueMsg")) {
                properties.payload = 1;
                {
                    let error = $root.spog.ValueMsg.verify(message.valueMsg, _depth + 1);
                    if (error)
                        return "valueMsg." + error;
                }
            }
            if (message.presenceMsg != null && $Object.hasOwnProperty.call(message, "presenceMsg")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.spog.PresenceMsg.verify(message.presenceMsg, _depth + 1);
                    if (error)
                        return "presenceMsg." + error;
                }
            }
            if (message.rateMsg != null && $Object.hasOwnProperty.call(message, "rateMsg")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.spog.RateMsg.verify(message.rateMsg, _depth + 1);
                    if (error)
                        return "rateMsg." + error;
                }
            }
            if (message.jsonFallback != null && $Object.hasOwnProperty.call(message, "jsonFallback")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                if (!$util.isString(message.jsonFallback))
                    return "jsonFallback: string expected";
            }
            if (message.logMsg != null && $Object.hasOwnProperty.call(message, "logMsg")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.spog.LogMsg.verify(message.logMsg, _depth + 1);
                    if (error)
                        return "logMsg." + error;
                }
            }
            return null;
        };

        /**
         * Creates a PayloadWrapper message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof spog.PayloadWrapper
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {spog.PayloadWrapper} PayloadWrapper
         */
        PayloadWrapper.fromObject = function (object, _depth) {
            if (object instanceof $root.spog.PayloadWrapper)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".spog.PayloadWrapper: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.spog.PayloadWrapper();
            if (object.valueMsg != null) {
                if (!$util.isObject(object.valueMsg))
                    throw $TypeError(".spog.PayloadWrapper.valueMsg: object expected");
                message.valueMsg = $root.spog.ValueMsg.fromObject(object.valueMsg, _depth + 1);
            }
            if (object.presenceMsg != null) {
                if (!$util.isObject(object.presenceMsg))
                    throw $TypeError(".spog.PayloadWrapper.presenceMsg: object expected");
                message.presenceMsg = $root.spog.PresenceMsg.fromObject(object.presenceMsg, _depth + 1);
            }
            if (object.rateMsg != null) {
                if (!$util.isObject(object.rateMsg))
                    throw $TypeError(".spog.PayloadWrapper.rateMsg: object expected");
                message.rateMsg = $root.spog.RateMsg.fromObject(object.rateMsg, _depth + 1);
            }
            if (object.jsonFallback != null)
                message.jsonFallback = $String(object.jsonFallback);
            if (object.logMsg != null) {
                if (!$util.isObject(object.logMsg))
                    throw $TypeError(".spog.PayloadWrapper.logMsg: object expected");
                message.logMsg = $root.spog.LogMsg.fromObject(object.logMsg, _depth + 1);
            }
            return message;
        };

        /**
         * Creates a plain object from a PayloadWrapper message. Also converts values to other types if specified.
         * @function toObject
         * @memberof spog.PayloadWrapper
         * @static
         * @param {spog.PayloadWrapper} message PayloadWrapper
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PayloadWrapper.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (message.valueMsg != null && $Object.hasOwnProperty.call(message, "valueMsg")) {
                object.valueMsg = $root.spog.ValueMsg.toObject(message.valueMsg, options, _depth + 1);
                if (options.oneofs)
                    object.payload = "valueMsg";
            }
            if (message.presenceMsg != null && $Object.hasOwnProperty.call(message, "presenceMsg")) {
                object.presenceMsg = $root.spog.PresenceMsg.toObject(message.presenceMsg, options, _depth + 1);
                if (options.oneofs)
                    object.payload = "presenceMsg";
            }
            if (message.rateMsg != null && $Object.hasOwnProperty.call(message, "rateMsg")) {
                object.rateMsg = $root.spog.RateMsg.toObject(message.rateMsg, options, _depth + 1);
                if (options.oneofs)
                    object.payload = "rateMsg";
            }
            if (message.jsonFallback != null && $Object.hasOwnProperty.call(message, "jsonFallback")) {
                object.jsonFallback = message.jsonFallback;
                if (options.oneofs)
                    object.payload = "jsonFallback";
            }
            if (message.logMsg != null && $Object.hasOwnProperty.call(message, "logMsg")) {
                object.logMsg = $root.spog.LogMsg.toObject(message.logMsg, options, _depth + 1);
                if (options.oneofs)
                    object.payload = "logMsg";
            }
            return object;
        };

        /**
         * Converts this PayloadWrapper to JSON.
         * @function toJSON
         * @memberof spog.PayloadWrapper
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PayloadWrapper.prototype.toJSON = function() {
            return PayloadWrapper.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for PayloadWrapper
         * @function getTypeUrl
         * @memberof spog.PayloadWrapper
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        PayloadWrapper.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/spog.PayloadWrapper";
        };

        return PayloadWrapper;
    })();

    return spog;
})();

export {
  $root as default
};
