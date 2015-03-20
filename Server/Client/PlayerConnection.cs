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
            InstanceContext context = new InstanceContext(this);
            client = new ServiceContractClient(context);
            client.ToServer(ConstructToServerData(ToServerMessageType.Subscribe));
        }

        public void QueueForMatch()
        {
            // announce we're looking for a match
            // all calls are asynchronous
            client.ToServer(ConstructToServerData(ToServerMessageType.QueueForMatch));
        }

        public void CancelQueueForMatch()
        {
            client.ToServer(ConstructToServerData(ToServerMessageType.CancelQueueForMatch));
        }

        private void TraceDataFromServer(ServerLib.ToClientData data)
        {
            int diff = (DateTime.Now - data.TimeStamp).Milliseconds;
            Debug.Log(this.GetType(), string.Format("Received debug message: {0} (delay {1}ms)", data.Message, diff));
        }
        
        public void ToClient(ServerLib.ToClientData data)
        {
            TraceDataFromServer(data);

            switch (data.MessageType)
            {
                case ServerLib.ToClientMessageType.Debug:
                    break;
                case ServerLib.ToClientMessageType.Frame:
                    FrameSentToClient(data);
                    break;
                case ServerLib.ToClientMessageType.StartMatch:
                    this.StartMatch();
                    break;
                default:
                    break;
            }
        }

        private void StartMatch()
        {
            ToWebClient("StartMatch");
        }

        public void FrameSentToClient(ServerLib.ToClientData data)
        {
            string message = "Received Message. Frame: " + data.FrameData.Frame;
            for (int i = 0; i < data.FrameData.Input.Length; i++)
            {
                message += string.Format(" Player {0} Input: {1}", i, data.FrameData.Input[i]);
            }

            string m = string.Format("{0}|{1}|{2}", 0, data.FrameData.Frame, data.TimeStamp.Ticks);
            for (int i = 0; i < data.FrameData.Input.Length; i++)
            {
                m += string.Format("|{0}", (int)data.FrameData.Input[i]);
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
                    MessageType = ToServerMessageType.Frame,
                    TimeStamp = timestamp,
                    FrameData = new FrameData()
                    {
                        Frame = Convert.ToUInt16(tokens[1]),
                        Input = new []{
                            (ServerLib.GameInputType)Convert.ToInt32(tokens[2])
                        }
                    }
                };

                return data;
            }

            return null;
        }

        public void StartTestInput()
        {
            ushort i = 0;
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
                    MessageType = ToServerMessageType.Frame,
                    TimeStamp = DateTime.Now,
                    FrameData = new FrameData()
                    {
                        Frame = i,
                        Input = new []{
                            (ServerLib.GameInputType)r.Next(0, 6)
                        }
                    }
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

            ushort i = 0;
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
                        MessageType = ToServerMessageType.Frame,
                        TimeStamp = DateTime.Now,
                        FrameData = new FrameData()
                        {
                            Frame = i,
                            Input = new []{
                                (ServerLib.GameInputType)r.Next(0, 6)
                            }
                        }
                    };
                    ToServer(data);

                    if(i%100 == 0)
                    {
                        int m = (i / 100) % 10;
                        string goalline = "";
                        for (int j = 0; j < 60; j++) { goalline += m; }
                        client.ToServer(ConstructToServerData(ToServerMessageType.Debug, message: goalline));
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
            string message = string.Format("Frame: {0}, Input:{1}", data.FrameData.Frame, data.FrameData.Input);
            Debug.Log(this.GetType(), "Sending message:" + message);
            client.ToServer(data);
        }

        public void Dispose()
        {
            try
            {
                Debug.Log(this.GetType(), "Disposing connection");
                client.ToServer(ConstructToServerData(ToServerMessageType.Unsubscribe));
                client.Close();
            }
            finally
            {
                client.Abort();
            }
        }

        private ToServerData ConstructToServerData(
            ToServerMessageType messageType,
            FrameData frameData = null,
            string message = null)
        {
            ToServerData data = new ToServerData()
            {
                MessageType = messageType,
                TimeStamp = DateTime.Now,
                FrameData = frameData,
                Message = message
            };

            return data;
        }
    }
}
