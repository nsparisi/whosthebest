using Client.ServiceReference;
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
    [CallbackBehavior(ConcurrencyMode = ConcurrencyMode.Single)]
    public class PlayerConnection : Client.ServiceReference.IServiceContractCallback, IDisposable
    {
        ServiceContractClient client;

        public PlayerConnection()
        {
            // create client connection with server
            InstanceContext context = new InstanceContext(this);
            client = new ServiceContractClient(context);

            // modify client address to be unique
            WSDualHttpBinding dualHttpBinding = (WSDualHttpBinding)client.Endpoint.Binding;
            string clientCallbackAddress = dualHttpBinding.ClientBaseAddress.AbsoluteUri;
            clientCallbackAddress += Guid.NewGuid().ToString();
            dualHttpBinding.ClientBaseAddress = new Uri(clientCallbackAddress);
        }
        
        public void ToClient(ServerLib.ToClientData data)
        {
            TraceDataFromServer(data);

            // send it off!
            ToWebClient(WebClientTranslator.Translate(data));
        }

        public void StartFromWeb()
        {
            //Thread listenForInput = new Thread(() =>
            //{
            //    while (true)
            //    {
            //        string message = Console.In.ReadLine();
            //        ToServerData data = WebClientTranslator.Translate(message);
            //        if (data != null)
            //        {
            //            ToServer(data);
            //        }
            //    }
            //});
            //listenForInput.IsBackground = false;
            //listenForInput.Start();

            while (true)
            {
                string message = Console.In.ReadLine();
                ToServerData data = WebClientTranslator.Translate(message);
                if (data != null)
                {
                    ToServer(data);
                }
            }
        }

        private void ToWebClient(string data)
        {
            Console.Out.WriteLine(data);
        }

        private void ToServer(ServerLib.ToServerData data)
        {
            Debug.Log(this.GetType(), "Sending message:" + data);
            client.ToServer(data);
        }

        public void Dispose()
        {
            try
            {
                Debug.Log(this.GetType(), "Disposing connection");
                client.Close();
            }
            finally
            {
                client.Abort();
            }
        }

        private void TraceDataFromServer(ServerLib.ToClientData data)
        {
            int diff = (DateTime.Now - data.TimeStamp).Milliseconds;
            Debug.Log(this.GetType(), string.Format("Received debug message: {0} (delay {1}ms)", data.Message, diff));
        }
    }
}
