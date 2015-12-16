/*
import {Socket} from "deps/phoenix/web/static/js/phoenix"

// import socket object from phoenix
// and establish a connection
let socket = new Socket("/gamesocket", {params: {user_token: window.userToken}})
socket.connect()

// join a channel, this will be the game server with game id
let channel = socket.channel("game:" + window.lastGameId, {})
channel.join()
  .receive("ok", resp => { console.log("Joined successfully", resp); testReady(); })
  .receive("error", resp => { console.log("Unable to join", resp) })

var testReady = function()
{
    channel.push("game:ready", {})
}
  
channel.on("game:ready", payload => {
    console.log("The game has started!")
})
  
channel.on("user_joined", payload => {
    console.log("User has joined : " + payload.user)
})

channel.on("broadcast", payload => {
    console.log(payload.user)
})

export default socket
*/