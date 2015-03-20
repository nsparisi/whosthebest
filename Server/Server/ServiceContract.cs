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

        private static uint totalConnections = 0;
        private static object syncRoot = new Object();

        public void ToServer(ToServerData data)
        {
            long ticks = (DateTime.Now - data.TimeStamp).Milliseconds;

            switch(data.MessageType)
            {
                case ToServerMessageType.Debug:
                    Debug.Log(this.GetType(), "Server received debug: {0}  (delay {1}ms)", data.Message, ticks.ToString());

                    break;
                case ToServerMessageType.Frame:
                    Debug.Log(this.GetType(), "Server received frame: {0} (delay {1}ms)", data.FrameData.Frame, ticks.ToString());

                    if (this.connectedMatch != null)
                    {
                        this.connectedMatch.AcceptData(data, player.Id);
                    }

                    break;
                case ToServerMessageType.Subscribe:
                    this.Subscribe();
                    break;
                case ToServerMessageType.Unsubscribe:
                    this.Unsubscribe();
                    break;
                case ToServerMessageType.QueueForMatch:
                    this.QueueForMatch();
                    break;
                case ToServerMessageType.CancelQueueForMatch:
                    this.CancelQueueForMatch();
                    break;
                default:
                    break;
            }
        }

        public void ToClient(ToClientData data)
        {
            clientConnection.ToClient(data);
        }

        public void AddedToMatch(Match match)
        {
            // save the match
            connectedMatch = match;

            // let client know they are in a match
            ToClient(new ToClientData()
            {
                MessageType = ToClientMessageType.StartMatch,
                TimeStamp = DateTime.Now
            });
        }

        public bool IsConnectionActive()
        {
            ICommunicationObject communication = (ICommunicationObject)clientConnection;
            Debug.Log(this.GetType(), "Communication state: {0}", communication.State);
            return communication.State == CommunicationState.Opened;
        }

        private bool Subscribe()
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

        private bool Unsubscribe()
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

        private void QueueForMatch()
        {
            // Search for a match
            // async! cancelqueue if you want to stop
            MatchManager.Instance.FindAppropriatePlayerForMatch(player);
        }

        private void CancelQueueForMatch()
        {
            MatchManager.Instance.RemovePlayerWaitingForMatch(player);
        }
    }
}
