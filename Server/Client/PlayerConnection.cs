using Client.ServiceReference;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.Text;
using System.Diagnostics;
using System.Threading;

namespace Client
{
    [CallbackBehavior(ConcurrencyMode = ConcurrencyMode.Single)]
    public class PlayerConnection : IServiceContractCallback, IDisposable
    {
        ServiceContractClient client;

        public PlayerConnection()
        {
            InstanceContext context = new InstanceContext(this);
            client = new ServiceContractClient(context);
            client.Subscribe();
        }

        public void LookForMatch()
        {
            while (true)
            {
                Debug.Log(this.GetType(), "Looking for match...");
                ToWebClient("Looking for match...");
                if (client.WaitForMatch())
                {
                    Debug.Log(this.GetType(), "Found match!");
                    break;
                }
            }
        }

        public void StartMatch()
        {
            ToWebClient("StartMatch");
        }

        public void ToClientDebug(string message, DateTime timestamp)
        {
            int diff = (DateTime.Now - timestamp).Milliseconds;
            Console.Out.WriteLine("Received Message:" + message + " : delay : " + diff + "ms");
        }

        public void ToClient(ServerLib.ToClientData data)
        {
            string message = "Received Message. Frame: " + data.Frame;
            for (int i = 0; i < data.PlayerInput.Length; i++)
            {
                message += string.Format(" Player {0} Input: {1}", i, data.PlayerInput[i]);
            }

            string m = string.Format("{0}|{1}|{2}", 0, data.Frame, data.Time.Ticks);
            for (int i = 0; i < data.PlayerInput.Length; i++)
            {
                m += string.Format("|{0}", (int)data.PlayerInput[i]);
            }

            ToWebClient(m);
        }

        public void ToWebClient(string data)
        {
            Console.Out.WriteLine(data);
        }

        public void StartFromWeb()
        {
            while (true)
            {
                string message = Console.In.ReadLine();
                ServerLib.ToServerData data = MakeFrameDataFromWeb(message);
                if(data != null)
                {
                    ToServer(data);
                }
            }
        }

        private ServerLib.ToServerData MakeFrameDataFromWeb(string message)
        {
            string[] tokens = message.Split('|');
            if(tokens.Length == 4 && tokens[0].Equals("0"))
            {

                long javascriptTime = Convert.ToInt32(tokens[2]);
                DateTime timestamp = new DateTime(1970, 1, 1, 0, 0, 0, 0).AddMilliseconds(javascriptTime);

                ServerLib.ToServerData data = new ServerLib.ToServerData()
                {
                    Frame = Convert.ToUInt32(tokens[1]),
                    Input = (ServerLib.GameInputType)Convert.ToInt32(tokens[2]),
                    Time = timestamp
                };

                return data;
            }

            return null;
        }

        public void StartTestInput()
        {
            uint i = 0;
            Random r = new Random();
            while(true)
            {
                Console.WriteLine("Ready to send messages");
                Console.WriteLine("Press <ENTER>.");
                Console.WriteLine();
                Console.ReadLine();

                i++;
                ServerLib.ToServerData data = new ServerLib.ToServerData()
                {
                    Frame = i,
                    Input = (ServerLib.GameInputType)r.Next(0, 6),
                    Time = DateTime.Now
                };

                ToServer(data);
            }
        }

        public void StartTestFast(long fps)
        {
            Stopwatch stopwatch = new Stopwatch();
            stopwatch.Start();
            DateTime logSinceLastSentMessage = DateTime.Now;

            long rateInMs = 1000 / fps;
            long remaining = rateInMs;
            long last = stopwatch.ElapsedMilliseconds;

            int i = 0;
            Random r = new Random();
            while (true)
            {
                long delta = stopwatch.ElapsedMilliseconds - last;
                remaining = remaining - delta;

                while (remaining <= 0)
                {
                    remaining += rateInMs;
                    //string message = "i: " + i;
                    //Console.Out.WriteLine(string.Format("Sending message:{0}, delta:{1}", message, (DateTime.Now - logSinceLastSentMessage).Milliseconds));
                    //client.ToServerDebug(message, DateTime.Now);


                    ServerLib.ToServerData data = new ServerLib.ToServerData()
                    {
                        Frame = (uint)i,
                        Input = (ServerLib.GameInputType) r.Next(0,6),
                        Time = DateTime.Now
                    };
                    ToServer(data);

                    if(i%100 == 0)
                    {
                        int m = (i / 100) % 10;
                        string goalline = "";
                        for (int j = 0; j < 60; j++) { goalline += m; }
                        client.ToServerDebug(goalline, DateTime.Now);
                        Console.Out.WriteLine(string.Format(goalline));
                    }

                    logSinceLastSentMessage = DateTime.Now;
                    i++;
                }

                last = stopwatch.ElapsedMilliseconds;

                //Console.WriteLine(string.Format("Stats. d:{0} r:{1}", delta, remaining));
                Thread.Sleep(0);
                //int sleep = 10000;
                //for (sleep = 10000; sleep > 0; sleep--) ;
            }
        }

        private void ToServer(ServerLib.ToServerData data)
        {
            string message = string.Format("Frame: {0}, Input:{1}", data.Frame, data.Input);
            Debug.Log(this.GetType(), "Sending message:" + message);
            client.ToServer(data);
        }

        public void Dispose()
        {
            try
            {
                Debug.Log(this.GetType(), "Disposing connection");
                client.Unsubscribe();
                client.Close();
            }
            finally
            {
                client.Abort();
            }
        }
    }
}
