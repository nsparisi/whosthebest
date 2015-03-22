function ServerTranslator()
{
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
        console.log("[received Debug] " + payload);
    }

    this.toClientStartMatch = function(payload)
    {
        console.log("[received StartMatch] ");
    }

    this.toClientFrame = function(payload)
    {
        console.log("[received Frame] " + payload);
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
        console.log("[to server]" + message);
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
        message += toServerData;
        message += self.PACKET_DELIMITER;
    }
}