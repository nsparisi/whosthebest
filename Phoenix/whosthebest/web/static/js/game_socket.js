import {Socket} from "deps/phoenix/web/static/js/phoenix"

// import socket object from phoenix
// and establish a connection
let socket = new Socket("/gamesocket", {params: {user_token: window.userToken}})
socket.connect()

// join a channel, this will be the game server with game id
let channel = socket.channel("game:play", {})
channel.join()
  .receive("ok", resp => { console.log("Joined successfully", resp) })
  .receive("error", resp => { console.log("Unable to join", resp) })

export default socket
