using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.Text;

namespace ServerLib
{
    [ServiceContract(CallbackContract = typeof(IServiceContractCallback))]
    public interface IServiceContract
    {
        [OperationContract(IsOneWay = true)]
        void ToServer(ToServerData data);
    }

    [DataContract]
    public class ToServerData
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

    [DataContract]
    public enum ToServerMessageType
    {
        [EnumMember]
        Debug = 0,

        [EnumMember]
        Subscribe,

        [EnumMember]
        Unsubscribe,

        [EnumMember]
        QueueForMatch,

        [EnumMember]
        CancelQueueForMatch,

        [EnumMember]
        Frame,
    }
}
