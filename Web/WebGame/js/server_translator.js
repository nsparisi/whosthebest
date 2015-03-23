function ServerConnection()
{
    // open the connection
    this.webSocket = new WebSocket("ws://localhost:8080");

    var self = this;
    this.webSocket.onopen = function()
    {
        console.log("The connection to the server was opened.");
        ServerTranslator.prototype.instance.toServerSubscribe();
    }

    this.webSocket.onclose = function(event)
    {
        console.log("The connection to the server was closed.");
        console.log("    code:" + event.code);
        console.log("    reason:" + event.reason);
        console.log("    wasClean:" + event.wasClean);
    }

    this.webSocket.onmessage = function(event)
    {
        console.log("Incoming message from server.");
        console.log("    data:" + event.data);
    }

    window.onbeforeunload = function()
    {
        self.websocket.onclose = function() { }; // disable onclose handler first
        self.websocket.close()
    };

    this.toServer = function(message)
    {
        if(self.webSocket.readyState == WebSocket.OPEN)
        {
            console.log("Sending message to server.");
            console.log("    message:" + message);
            self.webSocket.send(message);
        }
    }

    this.close = function()
    {
        ServerTranslator.prototype.instance.toServerUnsubscribe();
        self.webSocket.close();
    }
}

function ServerTranslator()
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
        if(self.serverConnection)
        {
            self.serverConnection.close();
        }

        self.serverConnection = new ServerConnection();
    }

    this.toClientTranslate = function(toClientData)
    {
        // <id>|timestamp|<type>|<payload>|<eom>
        var parts = toClientData.split(PACKET_DELIMITER);

        // validate proper message
        if(!self.toClientValidate(parts))
        {
            return;
        }

        var id = parts[0];
        var timestamp = parts[1];
        var messageType = parts[2];
        var payload = parts[3];

        if(messageType == self.toClientMessageType.Debug)
        {
            self.toClientDebug(payload);
        }
        else if(messageType == self.toClientMessageType.StartMatch)
        {
            self.toClientStartMatch(payload);
        }
        else if(messageType == self.toClientMessageType.Frame)
        {
            self.toClientFrame(payload);
        }
    }

    this.toClientValidate = function(parts)
    {
        return parts.length >= 4 && parts[0] == self.GAME_ID;
    }

    this.toClientDebug = function(payload)
    {
        console.log("[translator]received Debug " + payload);
    }

    this.toClientStartMatch = function(payload)
    {
        console.log("[translator]received StartMatch ");
    }

    this.toClientFrame = function(payload)
    {
        console.log("[translator]received Frame " + payload);
    }

    // ************************************
    // Send information to server
    // ************************************
    this.toServerDebug = function(message)
    {
        var packet = self.constructToServerPacket(
            self.toServerMessageType.Debug,
            message);

        self.toServer(packet);
    }

    this.toServerSubscribe = function()
    {
        var packet = self.constructToServerPacket(
            self.toServerMessageType.Subscribe);

        self.toServer(packet);
    }

    this.toServerUnsubscribe = function()
    {
        var packet = self.constructToServerPacket(
            self.toServerMessageType.Unsubscribe);

        self.toServer(packet);
    }

    this.toServerQueueForMatch = function()
    {
        var packet = self.constructToServerPacket(
            self.toServerMessageType.QueueForMatch);

        self.toServer(packet);
    }

    this.toServerCancelQueueForMatch = function()
    {
        var packet = self.constructToServerPacket(
            self.toServerMessageType.CancelQueueForMatch);

        self.toServer(packet);
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

        var packet = self.constructToServerPacket(
            self.toServerMessageType.Frame,
            payload);

        self.toServer(packet);
    }

    this.toServer = function(message)
    {
        // todo send packet to server
        if(self.serverConnection)
        {
            console.log("[translator]to server:" + message);
            self.serverConnection.toServer(message);
        }
    }

    this.constructToServerPacket = function(messageType, payload)
    {
        // <id>|timestamp|<type>|<payload>|<eom>
        var message = self.GAME_ID;
        message += self.PACKET_DELIMITER;

        // timestamp
        message += "0";
        message += self.PACKET_DELIMITER;

        // type
        message += messageType;
        message += self.PACKET_DELIMITER;

        // payload
        message += payload;
        message += self.PACKET_DELIMITER;

        return message;
    }
}