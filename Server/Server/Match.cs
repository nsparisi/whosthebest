﻿using ServerLib;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Server
{
    public class Match
    {
        List<Player> playersInMatch;
        List<Queue<ToServerData>> playerBuffers;
        ToClientData toClientData;

        object syncRoot = new Object();

        private int matchSeed = -1;
        public int MatchSeed
        {
            get
            {
                if (matchSeed == -1)
                {
                    Random random = new Random();
                    matchSeed = random.Next();
                }

                return matchSeed;
            }
        }

        public Match(params Player[] players)
        {
            playersInMatch = new List<Player>();
            playerBuffers = new List<Queue<ToServerData>>();
            toClientData = new ToClientData();

            // player i == playerbuffer i
            foreach (Player player in players)
            {
                playersInMatch.Add(player);
                playerBuffers.Add(new Queue<ToServerData>());
            }

            toClientData.MessageType = ToClientMessageType.Frame;
            toClientData.FrameData = new FrameData();
            toClientData.FrameData.Input = new GameInputType[playersInMatch.Count][];
        }

        public void AcceptData(ToServerData data, Guid fromPlayerId)
        {
            // Debug.Log(this.GetType(), "Processing packet: " + data.FrameData.Frame);

            lock (syncRoot)
            {
                // add packet to queue
                // we're assuming packets are streaming-in in-order
                for (int i = 0; i < playersInMatch.Count; i++)
                {
                    if (playersInMatch[i].Id.Equals(fromPlayerId))
                    {
                        playerBuffers[i].Enqueue(data);
                    }
                }

                // does every queue have a packet waiting?
                bool receivedAllPlayerPackets = true;
                for (int i = 0; i < playersInMatch.Count; i++)
                {
                    receivedAllPlayerPackets = receivedAllPlayerPackets & playerBuffers[i].Count > 0;
                }

                // if so, prepare to send out the frame to each player
                if (receivedAllPlayerPackets)
                {
                    // construct a sync'd up packet
                    for (int i = 0; i < playersInMatch.Count; i++)
                    {
                        ToServerData playerData = playerBuffers[i].Dequeue();
                        toClientData.FrameData.Frame = playerData.FrameData.Frame;
                        toClientData.FrameData.Input[i] = playerData.FrameData.Input[0];
                        toClientData.TimeStamp = DateTime.Now;
                    }

                    // send the packet to every player
                    for (int i = 0; i < playersInMatch.Count; i++)
                    {
                        // Debug.Log(this.GetType(), "sending data to client: {0}, frame: {1} ", i, toClientData.FrameData.Frame);
                        playersInMatch[i].Contract.ToClient(toClientData);
                    }
                }
            }
        }
    }
}
