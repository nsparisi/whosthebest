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
        void ToServerDebug(string data, DateTime timestamp);

        [OperationContract(IsOneWay = true)]
        void ToServer(ToServerData data);

        [OperationContract]
        bool Subscribe();

        [OperationContract]
        bool Unsubscribe();

        [OperationContract]
        bool WaitForMatch();
    }

    // Use a data contract as illustrated in the sample below to add composite types to service operations.
    // You can add XSD files into the project. After building the project, you can directly use the data types defined there, with the namespace "ServerLib.ContractType".
    [DataContract]
    public class ToServerData
    {
        uint frame;
        GameInputType input;
        DateTime time;

        [DataMember]
        public uint Frame
        {
            get { return frame; }
            set { frame = value; }
        }

        [DataMember]
        public GameInputType Input
        {
            get { return input; }
            set { input = value; }
        }

        [DataMember]
        public DateTime Time
        {
            get { return time; }
            set { time = value; }
        }
    }
}
