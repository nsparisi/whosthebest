// game_socket.js is loaded from the /game html page template.
// In this file we will prepare the socket object which will handle our
// connection to the phoenix server found in game_socket.ex.

// import Socket function from the phoenix-defined module
import {Socket} from "phoenix"

// import msgpack_socket from a neighboring file.
import msgpack_socket from "./msgpack_socket"

// We attach the socket to the window so we can use it in typescript-compiled game engine.
// I'm not sure of a better way to hand off this object from assets/js/
// to the compiled typescript project.
//
// As for window.userToken/guestToken, these tokens are supplied by the game_controller.ex 
// and we then pass them back when we make the socket connection to the server.
window.SOCKET = new Socket(
    "/gamesocket", 
    { 
        params: {
            user_token: window.userToken, 
            guest_token: window.guestToken
        }
    });

// We override the send and receive callbacks to serialize/deserialize 
// packet data into msgpack format.
window.SOCKET = msgpack_socket.convertToMsgPack(window.SOCKET);

// Make the connetion to the phoenix socket.
window.SOCKET.connect();