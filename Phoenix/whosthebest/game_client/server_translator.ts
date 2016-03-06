/// <reference path="references.ts" />
Debug.log("server_translator.ts");

// our socket connection is defined externally in game_socket.js
// window.Socket = new Socket(..)
declare var SOCKET: any;

/**
 * Represents the connection to the server. Responsible for setting up a channel 
 * and sending and receiving messages across the channel. 
 */
class ServerConnection
{
    channel: any;
    socket: any;
    
    initialize = () =>
    {
        // join a channel, this will be the game server with game id
        var channelName = "game:" + window["lastGameId"];
        Debug.log("joining channel. " + channelName);
        this.channel = SOCKET.channel("game:" + window["lastGameId"], {});
        this.channel.join()
            .receive("ok", resp => { onJoin(); })
            .receive("error", resp => { Debug.log("Unable to join" + resp) });

        this.channel.on("game:ready", payload => {
            Debug.log("game:ready!")
            
            // todo real random seed
            var dummyPayload = 1234;
            ServerTranslator.Instance.toClientStartMatch(dummyPayload);
        });
        
        this.channel.on("game:frame", payload => {        
            // todo real timestamp
            var dummyTimestamp = "0";
            ServerTranslator.Instance.toClientFrame(dummyTimestamp, payload.payload)
        });
          
        this.channel.on("user_joined", payload => {
            Debug.log("User has joined : " + payload.user)
        });
        
        var onJoin = () =>
        {
            Debug.log("The connection to the server was opened.");
            Debug.log(this.channel);
        }
    }
    
    toServerGameReady = () =>
    {
        this.channel.push("game:ready", {});
    }
    
    toServerGameFrame = (payload) =>
    {
        this.channel.push("game:frame", {payload: payload});
    }
    
    toServerGameEnd = () =>
    {
        this.channel.push("game:end", {});
    }

    close = () =>
    {
        // todo send disconnect
    }
    
    getChannelState = () =>
    {
        return this.channel.state;
    }
}

/**
 * Handles translation of payloads to and from server.
 */
class ServerTranslator
{
    // singleton implementation
    static Instance = new ServerTranslator();
    constructor()
    {
        if(ServerTranslator.Instance)
        {
            throw new Error("An instance of ServerTranslator already exists.");
        }
        
        ServerTranslator.Instance = this;
    }

    // handler for web socket
    serverConnection: ServerConnection;

    PACKET_DELIMITER = "|";
    FRAME_DELIMETER = "~";
    PLAYERINPUT_DELIMETER = ",";

    initialize = () =>
    {
        if(!this.serverConnection)
        {
            Debug.log("ServerTranslator initialize");
            this.serverConnection = new ServerConnection();
            this.serverConnection.initialize();
        }
    }

    toClientDebug = (payload) =>
    {
    }

    toClientStartMatch = (payload) =>
    {
        MainControl.Instance.switchToGame(payload);
    }

    toClientFrame = (timestamp: string, payload: string) =>
    {
        //frame~,player,1,inputs~player,2,inputs
        var parts = payload.split(this.FRAME_DELIMETER);
        if(parts.length >= 2)
        {
            var frame = parts[0];
            var inputs = [];
            for(var i = 1; i < parts.length; i++)
            {
                inputs.push(parts[i]);
            }

            var data = new FrameData(timestamp, frame, inputs);
            GenerationEngine.Instance.receiveFrameFromServer(data);
        }
    }

    // ************************************
    // Send information to server
    // ************************************
    toServerQueueForMatch = () =>
    {
        this.serverConnection.toServerGameReady();
    }

    toServerFrame = (frame, playerInputs) =>
    {
        // frame payload structure
        // frame~player,inputs,by,number
        var payload = "" + frame;
        payload += this.FRAME_DELIMETER;

        for(var i = 0; i < playerInputs.length; i++)
        {
            payload += this.PLAYERINPUT_DELIMETER;
            payload += playerInputs[i];
        }

        this.serverConnection.toServerGameFrame(payload);
    }
    
    toServerGameEnd = () =>
    {
        this.serverConnection.toServerGameEnd();
    }
    
    toServerDebug = (message: string) =>
    {
        //TODO send debug message
    }
}

/**
 * Represents the frame string in a readable data format
 */
class FrameData
{
    constructor(
        public time: string, 
        public frame: string, 
        public inputs: Array<string>)
        {
            
        }
}