//  file: web/static/js/msgpack_socket.js

var msgpack = require("./msgpack.min");

function convertToMsgPack(socket) 
{
  let parentOnConnOpen = socket.onConnOpen;

  socket.onConnOpen = function () {
    this.conn.binaryType = 'arraybuffer';
    parentOnConnOpen.apply(this, arguments);
  }

  //we also need to override the onConnMessage function, where we'll be checking
  //for binary data, and delegate to the default implementation if it's not what we expected
  let parentOnConnMessage = socket.onConnMessage;

  // This callback is defined in phoenix.js
  // this implementation is a direct copy from phoenix.js, but using msgpack to decode the message.
  socket.onConnMessage = function (rawMessage) {
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
  // this implementation is a direct copy from phoenix.js, but using msgpack to encode the message.
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

function decodeMessage(data) {
  if (!data) {
    return;
  }

  let binary = new Uint8Array(data);
  return msgpack.decode(binary);
}

function encodeMessage(data) {
  if (!data) {
    return;
  }

  return msgpack.encode(data);
}

export default {
  convertToMsgPack
}