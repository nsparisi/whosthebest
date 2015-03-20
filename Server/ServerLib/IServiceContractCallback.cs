using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.Text;

namespace ServerLib
{
    [ServiceContract]
    public interface IServiceContractCallback
    {
        [OperationContract(IsOneWay = true)]
        void ToClient(ToClientData data);
    }

    // Use a data contract as illustrated in the sample below to add composite types to service operations.
    // You can add XSD files into the project. After building the project, you can directly use the data types defined there, with the namespace "ServerLib.ContractType".
    [DataContract]
    public class ToClientData
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

    [DataContract]
    public enum ToClientMessageType
    {
        [EnumMember]
        Debug = 0,

        [EnumMember]
        StartMatch,

        [EnumMember]
        Frame,
    }
}
