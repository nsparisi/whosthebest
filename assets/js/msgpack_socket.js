// msgpack_socket.js intercepts the phoenix socket implementations for onConnOpen, onConnMessage, push,
// in order to encode/decode the packet data into the msgpack format.
// msgpack is a compressed form of json that helps us reduce the network traffic load we will be using during the game.
// http://msgpack.org/index.html

// import the msgpack library.
var msgpack = require("./msgpack.min");

/**
 * Converts the provided socket to encode/decode all sent and received packet data into msgpack format. 
 * The socket's onConnOpen, onConnMessage, and push functions are overridden.
 * 
 * @param {any} socket A Phoenix socket.
 * @returns The provided socket with updated msgpack capabilities.
 */
function convertToMsgPack(socket) 
{
  let parentOnConnOpen = socket.onConnOpen;

  socket.onConnOpen = function () {
    this.conn.binaryType = 'arraybuffer';
    parentOnConnOpen.apply(this, arguments);
  }
  
  let parentOnConnMessage = socket.onConnMessage;

  // This callback is defined in phoenix.js
  // this implementation is a direct copy from phoenix.js, 
  // but using msgpack to decode the message instead of json.
  socket.onConnMessage = function (rawMessage) {

    // run instead the default implementation if the payload is not what is expected.
    if (!(rawMessage.data instanceof window.ArrayBuffer)) {
      return parentOnConnMessage.apply(this, arguments);
    }

    let msg = decodeMessage(rawMessage.data);
    let topic = msg.topic;
    let event = msg.event;
    let payload = msg.payload;
    let ref = msg.ref;

    this.channels.filter(function (channel) {
      return channel.isMember(topic);
    }).forEach(function (channel) {
      return channel.trigger(event, payload, ref);
    });
    this.stateChangeCallbacks.message.forEach(function (callback) {
      return callback(msg);
    });
  }

  // This callback is defined in phoenix.js
  // this implementation is a direct copy from phoenix.js, 
  // but using msgpack to encode the message instead of json.
  socket.push = function (data) {
    let _this7 = this;

    let callback = function callback() {
      return _this7.conn.send(encodeMessage(data));
    };

    if (this.isConnected()) {
      callback();
    } else {
      this.sendBuffer.push(callback);
    }
  }

  return socket;
}

/**
 * Decodes the packet payload from msgpack format.
 * 
 * @param {any} data 
 * @returns 
 */
function decodeMessage(data) {
  if (!data) {
    return;
  }

  let binary = new Uint8Array(data);
  return msgpack.decode(binary);
}


/**
 * Encodes the packet payload into msgpack format.
 * 
 * @param {any} data 
 * @returns 
 */
function encodeMessage(data) {
  if (!data) {
    return;
  }

  return msgpack.encode(data);
}

// export this function to be called from game.js
export default {
  convertToMsgPack
}