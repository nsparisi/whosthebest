import {Socket} from "phoenix"
import {mainControl} from "web/static/js/game/common"
import {GenerationEngine} from "web/static/js/game/generation"

export function ServerConnection()
{
    var self = this;
    this.channel = {};
    this.initialize = function()
    {
        // import socket object from phoenix
        // and establish a connection
        self.socket = new Socket("/gamesocket", {params: {user_token: window.userToken}});
        self.socket.connect();

        // join a channel, this will be the game server with game id
        self.channel = self.socket.channel("game:" + window.lastGameId, {});
        self.channel.join()
            .receive("ok", resp => { onJoin(); })
            .receive("error", resp => { console.log("Unable to join", resp) });

        self.channel.on("game:ready", payload => {
            console.log("game:ready!")
            
            // todo real random seed
            var dummyPayload = 1234;
            ServerTranslator.prototype.instance.toClientStartMatch(dummyPayload);
        });
        
        self.channel.on("game:frame", payload => {        
            // todo real timestamp
            var dummyTimestamp = 0;
            ServerTranslator.prototype.instance.toClientFrame(dummyTimestamp, payload.payload)
        });
          
        self.channel.on("user_joined", payload => {
            console.log("User has joined : " + payload.user)
        });
    }
    
    this.toServerGameReady = function()
    {
        self.channel.push("game:ready", {});
    }
    
    this.toServerGameFrame = function(payload)
    {
        self.channel.push("game:frame", {payload: payload});
    }
    
    this.toServerGameEnd = function()
    {
        self.channel.push("game:end", {});
    }
    
    var self = this;
    var onJoin = function()
    {
        self.log("The connection to the server was opened.");
        console.log(self.channel);
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
    
    this.getChannelState = function()
    {
        return self.channel.state;
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

    var self = this;
    this.initialize = function()
    {
        if(!self.serverConnection)
        {
            console.log("Warning initiing!");
            self.serverConnection = new ServerConnection();
            self.serverConnection.initialize();
        }
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
    
    this.toServerGameEnd = function()
    {
        self.serverConnection.toServerGameEnd();
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