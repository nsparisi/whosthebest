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
                payload.game_id,
                payload.game_token);
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

    openChannelToGame = (game_id: string, game_token: string) =>
    {
        // join a channel, this will be the game server with game id
        // window["lastGameId"]
        var channelName = "g:" + game_id;
        Debug.log("joining channel. " + channelName);
        this.channel = SOCKET.channel(channelName, {game_token: game_token});
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
            
            ServerTranslator.Instance.toClientStartMatch(
                payload.random_seed, payload.user_index);
        });
        
        // "f" was formerly "game:frame"
        // "p" was formerly "payload"
        this.channel.on("f", payload => {     
            ServerTranslator.Instance.toClientFrame(
                payload.p, payload.t);
        });
          
        this.channel.on("game:joined", payload => {
            Debug.log("IN game:joined : " + payload.user);
        });
          
        this.channel.on("game:end", payload => {
            Debug.log(`IN game:end ${payload.winner_index}`);
            ServerTranslator.Instance.toClientMatchEnd(payload.winner_index);
        });
    }

    toServerGameReady = () =>
    {
        this.channel.push("game:ready", {});
    }
    
    toServerGameFrame = (payload) =>
    {
        // "f" was formerly "game:frame"
        // "p" was formerly "payload"
        this.channel.push("f", {p: payload});
    }
    
    toServerGameEnd = (winner_index: number, game_time: number) =>
    {
        if(this.channel)
        {
            this.channel.push(
                "game:end", 
                {winner_index: winner_index, game_time: game_time});
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

    TIME_DELIMITER = "|";
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

    connectToGame = (game_id: string, game_token: string) =>
    {
        if(!this.connectionToGameServer)
        {
            this.connectionToGameServer = new GameConnection();
            this.connectionToGameServer.openChannelToGame(game_id, game_token);
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
    
    toClientStartGame = (from_username: string, to_username: string, game_id: string, game_token: string) =>
    {
        GAME_INSTANCE.switchToGameLobby(from_username, to_username, game_id, game_token);
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

    toClientStartMatch = (random_seed: number, user_index: number) =>
    {
        Debug.log("toClientStartMatch: I am player " + user_index);
        GAME_INSTANCE.switchToGame(random_seed, user_index);
    }

    toClientFrame = (payload: string, serverOutTime: number) =>
    {
        //frame~,player,1,inputs|in_timestamp~player,2,inputs|in_timestamp
        var serverInTime: number;
        var parts = payload.split(this.FRAME_DELIMETER);
        if(parts.length >= 2)
        {
            var frame = parts[0];
            var inputs = [];
            for(var i = 1; i < parts.length; i++)
            {
                // need to strip out the timestamp
                var inputsAndTime = parts[i].split(this.TIME_DELIMITER);
                inputs.push(inputsAndTime[0]);
                if(i - 1 == GAME_INSTANCE.USER_INDEX)
                {
                    serverInTime = parseInt(inputsAndTime[1]);
                }
            }

            var data = new FrameData(serverInTime, serverOutTime, parseInt(frame), inputs);
            GenerationEngine.Instance.receiveFrameFromServer(data);
        }
    }

    toClientMatchEnd = (winner: number) =>
    {
        Debug.log("received message: toClientMatchEnd");
        GAME_INSTANCE.switchToGameOver(winner);
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
        payload += this.inputsToString(playerInputs);

        this.connectionToGameServer.toServerGameFrame(payload);
    }
    
    toServerGameEnd = (winner_index: number, game_time: number) =>
    {
        if(this.connectionToGameServer)
        {
            this.connectionToGameServer.toServerGameEnd(winner_index, game_time);
        }
    }
    
    toServerDebug = (message: string) =>
    {
        //TODO send debug message
    }
    
    inputsToString = (playerInputs) =>
    {
        var asString = "";
        for(var i = 0; i < playerInputs.length; i++)
        {
            asString += this.PLAYERINPUT_DELIMETER;
            asString += playerInputs[i];
        }
        return asString;
    }
}

/**
 * Represents the frame string in a readable data format
 */
class FrameData
{
    constructor(
        public serverTimeIn: number, 
        public serverTimeOut: number, 
        public frame: number, 
        public inputs: Array<string>)
        {
            
        }
}