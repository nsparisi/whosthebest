using Client.ServiceReference;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.Text;

namespace Client
{
    [CallbackBehavior(ConcurrencyMode = ConcurrencyMode.Reentrant)]
    public class Receiver : IServiceContractCallback, IDisposable
    {
        ServiceContractClient client;

        public Receiver()
        {
            InstanceContext context = new InstanceContext(this);
            client = new ServiceContractClient(context);
            client.Subscribe();
        }
        
        public void OnMessageAdded(string message, DateTime timestamp)
        {
        }

        public void Dispose()
        {
            Console.Out.WriteLine("Disposing receiver");
            client.Unsubscribe();
            client.Close();
        }

        public void ToClientDebug(string message, DateTime timestamp)
        {
            int diff = (DateTime.Now - timestamp).Milliseconds;
            Console.Out.WriteLine("Received Message:" + message + " : delay : " + diff + "ms");
        }

        public void ToClient(ServerLib.ToClientData data)
        {
            int diff = (DateTime.Now - data.Time).Milliseconds;
            Console.Out.WriteLine("Received Message:" + data.Frame + " : delay : " + diff + "ms");
        }

        public void StartMatch()
        {
        }
    }
}
