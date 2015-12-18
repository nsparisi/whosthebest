import {Socket} from "deps/phoenix/web/static/js/phoenix"
import {mainControl} from "web/static/js/game/common"
import {GenerationEngine} from "web/static/js/game/generation"

export function ServerConnection()
{
    // import socket object from phoenix
    // and establish a connection
    let socket = new Socket("/gamesocket", {params: {user_token: window.userToken}})
    socket.connect()

    // join a channel, this will be the game server with game id
    let channel = socket.channel("game:" + window.lastGameId, {})
    channel.join()
        .receive("ok", resp => { onJoin(); })
        .receive("error", resp => { console.log("Unable to join", resp) })

    channel.on("game:ready", payload => {
        console.log("game:ready!")
        
        // todo real random seed
        var dummyPayload = 1234;
        ServerTranslator.prototype.instance.toClientStartMatch(dummyPayload);
    })
    
    channel.on("game:frame", payload => {        
        // todo real timestamp
        var dummyTimestamp = 0;
        ServerTranslator.prototype.instance.toClientFrame(dummyTimestamp, payload.payload)
    })
      
    channel.on("user_joined", payload => {
        console.log("User has joined : " + payload.user)
    })
    
    this.toServerGameReady = function()
    {
        channel.push("game:ready", {});
    }
    
    this.toServerGameFrame = function(payload)
    {
        channel.push("game:frame", {payload: payload});
    }
    
    this.toServerGameEnd = function()
    {
        channel.push("game:end", {});
    }
    
    var self = this;
    var onJoin = function()
    {
        self.log("The connection to the server was opened.");
    }

    this.log = function(msg)
    {
        //console.log(msg);
    }

    window.onbeforeunload = function()
    {
        // todo send disconnect
    };

    this.close = function()
    {
        // todo send disconnect
    }
    
    this.readyState = "Good";
}

export function ServerTranslator()
{
    ServerTranslator.prototype.instance = this;

    // handler for web socket
    this.serverConnection;

    this.PACKET_DELIMITER = "|";
    this.FRAME_DELIMETER = "~";
    this.PLAYERINPUT_DELIMETER = ",";
    this.GAME_ID = "00";
    
    this.toClientMessageType = 
        {
            Debug: 0,
            StartMatch: 1,
            Frame: 2
        }

    this.toServerMessageType = 
        {
            Debug: 0,
            Subscribe: 1,
            Unsubscribe: 2,
            QueueForMatch: 3,
            CancelQueueForMatch: 4,
            Frame: 5
        };

    var self = this;
    this.initialize = function()
    {
        self.serverConnection = new ServerConnection();
    }

    this.toClientDebug = function(payload)
    {
    }

    this.toClientStartMatch = function(payload)
    {
        mainControl.switchToGame(payload);
    }

    this.toClientFrame = function(timestamp, payload)
    {
        //frame~,player,1,inputs~player,2,inputs
        var parts = payload.split(self.FRAME_DELIMETER);
        if(parts.length >= 2)
        {
            var frame = parts[0];
            var inputs = [];
            for(var i = 1; i < parts.length; i++)
            {
                var playerInputs = parts[i];
                inputs.push(playerInputs);
            }

            var data = new FrameData(timestamp, frame, inputs);
            if(GenerationEngine.prototype.instance)
            {
                GenerationEngine.prototype.instance.receiveFrameFromServer(data);
            }
        }
    }

    // ************************************
    // Send information to server
    // ************************************
    this.toServerQueueForMatch = function()
    {
        self.serverConnection.toServerGameReady();
    }

    this.toServerFrame = function(frame, playerInputs)
    {
        // frame payload structure
        // frame~player,inputs,by,number
        var payload = "" + frame;
        payload += self.FRAME_DELIMETER;

        for(var i = 0; i < playerInputs.length; i++)
        {
            payload += self.PLAYERINPUT_DELIMETER;
            payload += playerInputs[i];
        }

        self.serverConnection.toServerGameFrame(payload);
    }
}

// ************************************************
// FrameData object.
// Represents the frame string in a readable data format
// ************************************************
export function FrameData(time, frame, inputs)
{
    this.time = time;
    this.frame = frame;
    this.inputs = inputs;
}