using ServerLib;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.Text;
using System.Threading;

namespace Server
{
    [ServiceBehavior(InstanceContextMode = InstanceContextMode.PerSession, ConcurrencyMode = ConcurrencyMode.Single)]
    public class ServiceContract : IServiceContract
    {
        private Player player;
        private IServiceContractCallback clientConnection;
        private Match connectedMatch;

        // static vars
        private static uint totalConnections = 0;
        private static object syncRoot = new Object();

        public void ToServerDebug(string data, DateTime timestamp)
        {
            long ticks = (DateTime.Now - timestamp).Milliseconds;
            Debug.Log(this.GetType(), "Server received data: {0} : delay {1}ms", data, ticks.ToString());
        }

        public void ToServer(ToServerData data)
        {
            long ticks = (DateTime.Now - data.Time).Milliseconds;
            Debug.Log(this.GetType(), "Server received frame: {0} : delay {1}ms", data.Frame, ticks.ToString());
            if(this.connectedMatch != null)
            {
                this.connectedMatch.AcceptData(data, player.Id);
            }
        }

        public void ToClient(ToClientData data)
        {
            clientConnection.ToClient(data);
        }

        public bool Subscribe()
        {
            try
            {
                lock (syncRoot)
                {
                    // player initialization
                    totalConnections++;
                    string playerName = "Player " + totalConnections;
                    Debug.Log(this.GetType(), "Hello {0}", playerName);
                    this.player = new Player(this, playerName);

                    // channel back to client
                    this.clientConnection = OperationContext.Current.GetCallbackChannel<IServiceContractCallback>();
                    return true;
                }
            } 
            catch
            {
                return false;
            }
        }

        public bool Unsubscribe()
        {
            try
            {
                Debug.Log(this.GetType(), "Goodbye {0}", this.player.Name);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public bool WaitForMatch()
        {
            // Search for a match
            // no waiting!
            MatchManager.Instance.FindAppropriatePlayerForMatch(player);

            // Wait until put in a match or timed-out
            WaitToBePlacedInMatch();

            if(connectedMatch == null)
            {
                MatchManager.Instance.RemovePlayerWaitingForMatch(player);

                // could have context switched
                if (connectedMatch == null)
                {
                    return false;
                }
            }

            return true;
        }

        public void AddedToMatch(Match match)
        {
            connectedMatch = match;
            clientConnection.StartMatch();
        }

        public bool IsConnectionActive()
        {
            ICommunicationObject communication = (ICommunicationObject)clientConnection;
            Debug.Log(this.GetType(), "Communication state: {0}", communication.State);
            return communication.State == CommunicationState.Opened;
        }

        private void WaitToBePlacedInMatch()
        {
            const long timeoutMs = 1 * 1000 * 60;
            Stopwatch watch = new Stopwatch();
            watch.Start();
            while (connectedMatch == null)
            {
                Thread.Sleep(1000);

                if (watch.ElapsedMilliseconds > timeoutMs)
                {
                    break;
                }
            }
            watch.Stop();
        }

        //public void Broadcast(string message, DateTime time)
        //{
        //    // this.Debug("Number of suscribers: " + subscribers.Count());
        //    foreach (IServiceContractCallback client in allConnections)
        //    {
        //        ICommunicationObject communication = (ICommunicationObject)client;
        //        if(communication.State == CommunicationState.Opened)
        //        {
        //            client.ServerToClient(message, time);
        //        }
        //    }
        //}
    }
}
