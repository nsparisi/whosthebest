// import Socket function from the phoenix-defined module
import {Socket} from "phoenix"

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
window.SOCKET.connect();