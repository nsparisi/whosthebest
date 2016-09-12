/// <reference path="references.ts" />

// our socket connection is defined externally in game_socket.js
// window.Socket = new Socket(..)
declare var SOCKET: any;

class LobbyConnection
{
    channel: any;
    users: Array<Array<string>> = new Array();
    useridToUsername = new Array();
    usernameToUserid = new Array();
    
    closeChannelToLobby = () =>
    {
        if(this.channel)
        {
            Debug.log("leaving channel lobby:main. ");
            this.channel.leave()
                .receive("ok", () => { Debug.log("response, left channel lobby:main. "); } );
            this.channel = null;

            this.users = new Array();
        }
    }

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
            Debug.log("The lobby connection to the server was opened. " + channelName + " : " + resp.username);
            ServerTranslator.Instance.toClientJoined(resp.username);
        }

        var onFail = (resp) =>
        {
            Debug.log("Unable to join lobby: " + resp);
        }

        var userJoined = (username: string, phx_ref: string, user_id: string) => 
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

            // update dictionary of id > username
            this.useridToUsername[user_id] = username;
            this.usernameToUserid[username] = user_id;
        }

        var userLeft = (username: string, phx_ref: string) => 
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
                    userJoined(username, phx_ref, key);
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
                    userJoined(username, phx_ref, key);
                }
            }

            ServerTranslator.Instance.toClientLobbyUserListUpdate(this.users);
        });

        this.channel.on("lobby:message", payload => {
            Debug.log(`IN lobby:message. ${payload.from_id} -> ${payload.message}`);
            ServerTranslator.Instance.toClientLobbyMessage(
                this.safeGetUsername(payload.from_id), 
                payload.message);
        });
        
        this.channel.on("lobby:ask", payload => {
            Debug.log(`IN lobby:ask. ${payload.from_id} -> ${payload.to_id}`);
            ServerTranslator.Instance.toClientAskUser(
                this.safeGetUsername(payload.from_id), 
                this.safeGetUsername(payload.to_id));
        });
        
        this.channel.on("lobby:response", payload => {     
            Debug.log(`IN lobby:response. ${payload.from_id} -> ${payload.to_id} : ${payload.accepted}`);
            ServerTranslator.Instance.toClientRespondToUser(
                this.safeGetUsername(payload.from_id), 
                this.safeGetUsername(payload.to_id), 
                payload.accepted);   
        });
          
        this.channel.on("lobby:start_game", payload => {
            Debug.log(`IN lobby:start_game. ${payload.from_id} -> ${payload.to_id} : ${payload.game_id}`);
            ServerTranslator.Instance.toClientStartGame(
                this.safeGetUsername(payload.from_id), 
                this.safeGetUsername(payload.to_id), 
                payload.game_id);
        });
    }

    toServerLobbyMessage = (message: string) =>
    {
        Debug.log(`OUT lobby:message. ${message}`);
        this.channel.push("lobby:message", {message: message});
    }

    toServerAskUser = (to_username: string) =>
    {
        var to_id = this.safeGetUserid(to_username);
        Debug.log(`OUT lobby:ask. ${to_id}`);
        this.channel.push("lobby:ask", {to_id: to_id});
    }
    
    toServerRespondToUser = (to_username: string, accepted: boolean) =>
    {
        var to_id = this.safeGetUserid(to_username);
        Debug.log(`OUT lobby:response. ${to_id} : ${accepted}`);
        this.channel.push("lobby:response", {to_id: to_id, accepted: accepted});
    }

    safeGetUsername = (user_id: string) =>
    {
        if(this.useridToUsername[user_id])
        {
            return this.useridToUsername[user_id];
        }

        return "unknown";
    }

    safeGetUserid = (username: string) =>
    {
        if(this.usernameToUserid[username])
        {
            return this.usernameToUserid[username];
        }

        throw "username not found.";
    }
}

/**
 * Represents the connection to the server. Responsible for setting up a channel 
 * and sending and receiving messages across the channel. 
 */
class GameConnection
{
    channel: any;

    closeChannelToGame = () =>
    {
        if(this.channel)
        {
            Debug.log("leaving channel. ");
            this.channel.leave()
                .receive("ok", () => { Debug.log("response, left channel game:. "); } );
                
            this.channel = null;
        }
    }

    openChannelToGame = (game_id: string) =>
    {
        // join a channel, this will be the game server with game id
        // window["lastGameId"]
        var channelName = "game:" + game_id;
        Debug.log("joining channel. " + channelName);
        this.channel = SOCKET.channel(channelName, {});
        this.channel.join()
            .receive("ok", resp => { onJoin(resp); })
            .receive("error", resp => { onFail(resp); });

        var onJoin = (resp) =>
        {
            Debug.log("The lobby connection to the server was opened. " + channelName);
        }

        var onFail = (resp) =>
        {
            Debug.log("Unable to join lobby: " + resp);
        }

        this.channel.on("game:ready", payload => {
            Debug.log(`IN game:ready seed: ${payload.random_seed}`);
            
            ServerTranslator.Instance.toClientStartMatch(payload.random_seed);
        });
        
        this.channel.on("game:frame", payload => {        
            // todo real timestamp
            var dummyTimestamp = "0";
            ServerTranslator.Instance.toClientFrame(dummyTimestamp, payload.payload);
        });
          
        this.channel.on("game:joined", payload => {
            Debug.log("IN game:joined : " + payload.user);
        });
          
        this.channel.on("game:end", payload => {
            Debug.log("IN game:end");
            ServerTranslator.Instance.toClientMatchEnd();
        });
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
        if(this.channel)
        {
            this.channel.push("game:end", {});
        }
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

    }

    connectToLobby = () =>
    {
        Debug.log("ServerTranslator connectToLobby");
        if(!this.connectionToLobbyServer)
        {
            this.connectionToLobbyServer = new LobbyConnection();
        }

        this.connectionToLobbyServer.openChannelToLobby();
    }

    disconnectFromLobby = () =>
    {
        Debug.log("ServerTranslator disconnectFromLobby");
        if(this.connectionToLobbyServer)
        {
            this.connectionToLobbyServer.closeChannelToLobby();
        }
        
        this.connectionToLobbyServer = null;
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

    disconnectFromGame = () =>
    {
        Debug.log("ServerTranslator disconnectFromGame");
        if(this.connectionToGameServer)
        {
            this.connectionToGameServer.closeChannelToGame();
        }

        this.connectionToGameServer = null;
    }

    // ************************************
    // LOBBY: Send information to client
    // ************************************
    toClientJoined = (username: string) =>
    {
        Debug.log("setting LOGGED_IN_USERNAME " + username);
        GAME_INSTANCE.LOGGED_IN_USERNAME = username;
    }

    toClientLobbyUserListUpdate = (users: Array<Array<string>>) =>
    {
        GAME_INSTANCE.refreshLobbyUsers(users);
    }

    toClientLobbyMessage = (username: string, message: string) =>
    {
        GAME_INSTANCE.addLobbyChatMessage(username, message);
    }

    toClientAskUser = (from_username: string, to_username: string) =>
    {
        GAME_INSTANCE.receivedAsk(from_username, to_username);
    }
    
    toClientRespondToUser = (from_username: string, to_username: string, accepted: boolean) =>
    {
        GAME_INSTANCE.receivedResponse(from_username, to_username, accepted);
    }
    
    toClientStartGame = (from_username: string, to_username: string, game_id: string) =>
    {
        GAME_INSTANCE.switchToGameLobby(from_username, to_username, game_id);
    }
    
    // ************************************
    // LOBBY: Send information to server
    // ************************************
    toServerLobbyMessage = (message: string) =>
    {
        this.connectionToLobbyServer.toServerLobbyMessage(message);
    }
    
    toServerAskUser = (to_username: string) =>
    {
        this.connectionToLobbyServer.toServerAskUser(to_username);
    }
    
    toServerRespondToUser = (to_username: string, accepted: boolean) =>
    {
        this.connectionToLobbyServer.toServerRespondToUser(to_username, accepted);
    }

    // ************************************
    // GAME: Send information to client 
    // ************************************
    toClientDebug = (payload) =>
    {
    }

    toClientStartMatch = (random_seed: number) =>
    {
        GAME_INSTANCE.switchToGame(random_seed);
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

    toClientMatchEnd = () =>
    {
        GAME_INSTANCE.switchToMenu();
    }

    // ************************************
    // GAME: Send information to server
    // ************************************
    toServerGameReady = () =>
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