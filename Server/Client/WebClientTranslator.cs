﻿using Client.ServiceReference;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.Text;
using System.Diagnostics;
using System.Threading;
using ServerLib;

namespace Client
{
    public class WebClientTranslator
    {

        public static void Translate(string message)
        {
        }

        public static void Translate()
        {
        }
    }

    public class ToWebData
    {
        FrameData frameData;
        DateTime timeStamp;
        ToClientMessageType messageType;
        string message;

        [DataMember]
        public string Message
        {
            get { return message; }
            set { message = value; }
        }

        [DataMember]
        public FrameData FrameData
        {
            get { return frameData; }
            set { frameData = value; }
        }

        [DataMember]
        public DateTime TimeStamp
        {
            get { return timeStamp; }
            set { timeStamp = value; }
        }

        [DataMember]
        public ToClientMessageType MessageType
        {
            get { return messageType; }
            set { messageType = value; }
        }
    }

    public class FromWebData
    {
        FrameData frameData;
        DateTime timeStamp;
        ToServerMessageType messageType;
        string message;

        [DataMember]
        public string Message
        {
            get { return message; }
            set { message = value; }
        }

        [DataMember]
        public FrameData FrameData
        {
            get { return frameData; }
            set { frameData = value; }
        }

        [DataMember]
        public DateTime TimeStamp
        {
            get { return timeStamp; }
            set { timeStamp = value; }
        }

        [DataMember]
        public ToServerMessageType MessageType
        {
            get { return messageType; }
            set { messageType = value; }
        }
    }
}
