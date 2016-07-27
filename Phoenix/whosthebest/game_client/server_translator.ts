/// <reference path="references.ts" />
Debug.log("server_translator.ts");

// our socket connection is defined externally in game_socket.js
// window.Socket = new Socket(..)
declare var SOCKET: any;

class LobbyConnection
{
    channel: any;
    users: Array<Array<string>> = new Array();
    
    openChannelToLobby = () =>
    {
        var channelName = "lobby:main";
        Debug.log("joining channel. " + channelName);
        this.channel = SOCKET.channel(channelName, {});
        this.channel.join()
            .receive("ok", resp => { onJoin(resp); })
            .receive("error", resp => { onFail(resp); });

        var onJoin = (resp) =>
        {
            Debug.log("The lobby connection to the server was opened.");
            Debug.log(this.channel);
        }

        var onFail = (resp) =>
        {
            Debug.log("Unable to join lobby: " + resp);
        }

        var userJoined = (username, phx_ref) => 
        {
            Debug.log(`Player has joined: ${username}`);
            if(!(username in this.users))
            {
                this.users[username] = new Array();
            }

            if(this.users[username].indexOf(phx_ref) < 0)
            {
                this.users[username].push(phx_ref);
            }
        }

        var userLeft = (username, phx_ref) => 
        {
            Debug.log(`Player has left: ${username}`);
            if(username in this.users && 
                this.users[username].indexOf(phx_ref) >= 0)
            {
                var index = this.users[username].indexOf(phx_ref);
                this.users[username].splice(index, 1);
            }

            if(username in this.users && this.users[username].length == 0)
            {
                delete this.users[username];
            }
        }
        
        this.channel.on("presence_state", payload => {
            for(var key in payload)
            {
                // metas contains an entry for each connection by the same user
                var metas = payload[key]["metas"];
                for(var metakey in metas)
                {
                    var username = metas[metakey]["username"];
                    var phx_ref = metas[metakey]["phx_ref"];
                    userJoined(username, phx_ref);
                }
            }

            ServerTranslator.Instance.toClientLobbyUserListUpdate(this.users);
        });
        
        this.channel.on("presence_diff", payload => {            
            for(var key in payload["leaves"])
            {
                var metas = payload["leaves"][key]["metas"];
                for(var metakey in metas)
                {
                    var username = metas[metakey]["username"];
                    var phx_ref = metas[metakey]["phx_ref"];
                    userLeft(username, phx_ref);
                }
            }
            
            for(var key in payload["joins"])
            {
                var metas = payload["joins"][key]["metas"];
                for(var metakey in metas)
                {
                    var username = metas[metakey]["username"];
                    var phx_ref = metas[metakey]["phx_ref"];
                    userJoined(username, phx_ref);
                }
            }

            ServerTranslator.Instance.toClientLobbyUserListUpdate(this.users);
        });

        this.channel.on("lobby:message", payload => {
            Debug.log(`IN lobby:message. ${payload.from_id} -> ${payload.message}`)
            ServerTranslator.Instance.toClientLobbyMessage(payload.from_id, payload.message);
        });
        
        this.channel.on("lobby:ask", payload => {
            Debug.log(`IN lobby:ask. ${payload.from_id} -> ${payload.to_id}`)
            ServerTranslator.Instance.toClientAskUser(payload.from_id, payload.to_id);
        });
        
        this.channel.on("lobby:response", payload => {     
            Debug.log(`IN lobby:response. ${payload.from_id} -> ${payload.to_id} : ${payload.accepted}`)
            ServerTranslator.Instance.toClientRespondToUser(payload.from_id, payload.to_id, payload.accepted);   
        });
          
        this.channel.on("lobby:start_game", payload => {
            Debug.log("IN lobby:start_game. ${payload.from_id} -> ${payload.to_id} : ${payload.game_id}")
            ServerTranslator.Instance.toClientStartGame(payload.from_id, payload.to_id, payload.game_id);
        });
    }

    toServerAskUser = (to_id: string) =>
    {
        Debug.log("OUT lobby:ask. ${to_id}")
        this.channel.push("lobby:ask", {to_id: to_id});
    }
    
    toServerRespondToUser = (to_id: string, accepted: boolean) =>
    {
        Debug.log("OUTIN lobby:response. ${to_id} : ${accepted}")
        this.channel.push("lobby:response", {to_id: to_id, accepted: accepted});
    }

}

/**
 * Represents the connection to the server. Responsible for setting up a channel 
 * and sending and receiving messages across the channel. 
 */
class GameConnection
{
    channel: any;

    openChannelToGame = (game_id: string) =>
    {
        // join a channel, this will be the game server with game id
        // window["lastGameId"]
        var channelName = "game:" + game_id;
        Debug.log("joining channel. " + channelName);
        this.channel = SOCKET.channel(channelName, {});
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
    connectionToGameServer: GameConnection;
    connectionToLobbyServer: LobbyConnection;

    PACKET_DELIMITER = "|";
    FRAME_DELIMETER = "~";
    PLAYERINPUT_DELIMETER = ",";

    initialize = () =>
    {
        if(!this.connectionToLobbyServer)
        {
            Debug.log("ServerTranslator initialize");
            this.connectionToLobbyServer = new LobbyConnection();
            this.connectionToLobbyServer.openChannelToLobby();
        }
    }

    connectToGame = (game_id: string) =>
    {
        if(!this.connectionToGameServer)
        {
            this.connectionToGameServer = new GameConnection();
            this.connectionToGameServer.openChannelToGame(game_id);
        }
        else 
        {
            Debug.logError("ServerTranslator: already connected to a game.");
        }
    }

    // ************************************
    // LOBBY: Send information to client
    // ************************************
    toClientLobbyUserListUpdate = (users) =>
    {
        console.log(users);
    }

    toClientLobbyMessage = (from_id: string, message: string) =>
    {
        Debug.log(`hello [${from_id}]: ${message}`);
    }

    toClientAskUser = (from_id: string, to_id: string) =>
    {
        Debug.log(`${from_id}: do you want to play a game?`);
    }
    
    toClientRespondToUser = (from_id: string, to_id: string, accepted: boolean) =>
    {
        Debug.log(`${from_id}: I have chosen ${accepted}?.`);
    }
    
    toClientStartGame = (from_id: string, to_id: string, game_id: string) =>
    {
        this.connectToGame(game_id);
    }
    
    // ************************************
    // LOBBY: Send information to server
    // ************************************
    toServerAskUser = (to_id: string) =>
    {
        this.connectionToLobbyServer.toServerAskUser(to_id);
    }
    
    toServerRespondToUser = (to_id: string, accepted: boolean) =>
    {
        this.connectionToLobbyServer.toServerRespondToUser(to_id, accepted);
    }

    // ************************************
    // GAME: Send information to client 
    // ************************************
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
    // GAME: Send information to server
    // ************************************
    toServerQueueForMatch = () =>
    {
        this.connectionToGameServer.toServerGameReady();
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

        this.connectionToGameServer.toServerGameFrame(payload);
    }
    
    toServerGameEnd = () =>
    {
        this.connectionToGameServer.toServerGameEnd();
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