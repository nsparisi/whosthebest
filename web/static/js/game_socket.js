// import Socket function from the phoenix-defined module
import {Socket} from "phoenix"
import msgpack_socket from "./msgpack_socket"

// globally define our socket connection
// so we can use it in typescript
window.SOCKET = new Socket(
    "/gamesocket", 
    { 
        params: {
            user_token: window.userToken, 
            guest_token: window.guestToken
        }
    });
window.SOCKET = msgpack_socket.convertToMsgPack(window.SOCKET);
window.SOCKET.connect();