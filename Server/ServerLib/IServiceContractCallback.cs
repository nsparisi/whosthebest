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
        void ToClientDebug(string message, DateTime timestamp);

        [OperationContract(IsOneWay = true)]
        void ToClient(ToClientData data);

        [OperationContract(IsOneWay = true)]
        void StartMatch();
    }

    // Use a data contract as illustrated in the sample below to add composite types to service operations.
    // You can add XSD files into the project. After building the project, you can directly use the data types defined there, with the namespace "ServerLib.ContractType".
    [DataContract]
    public class ToClientData
    {
        uint frame;
        GameInputType[] playerInput;
        DateTime time;

        [DataMember]
        public uint Frame
        {
            get { return frame; }
            set { frame = value; }
        }

        [DataMember]
        public GameInputType[] PlayerInput
        {
            get { return playerInput; }
            set { playerInput = value; }
        }

        [DataMember]
        public DateTime Time
        {
            get { return time; }
            set { time = value; }
        }
    }
}
