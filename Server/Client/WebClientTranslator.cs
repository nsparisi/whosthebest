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
    public class WebClientTranslator
    {
        private static readonly char PACKET_DELIMITER = '|';
        private static readonly char FRAME_DELIMETER = '~';
        private static readonly char PLAYERINPUT_DELIMETER = ',';
        private static readonly string GAME_ID = "00";
        private static readonly DateTime ORIGIN_TIME = new DateTime(1970, 1, 1, 0, 0, 0, 0);

        // ***********************************************************
        // To Client Translations
        // ***********************************************************
        #region to client translations

        public static string Translate(ToClientData toClientData)
        {
            // <id>|timestamp|<type>|<payload>|<eom>
            StringBuilder translation = new StringBuilder();

            // id
            translation.Append(GAME_ID);
            translation.Append(PACKET_DELIMITER);

            // timestamp
            translation.Append(ToClientTimestampTranslation(toClientData.TimeStamp));
            translation.Append(PACKET_DELIMITER);

            // type
            translation.Append(ToClientMessageTypeTranslation(toClientData.MessageType));
            translation.Append(PACKET_DELIMITER);

            // payload
            switch(toClientData.MessageType)
            {
                case ToClientMessageType.StartMatch:
                    translation.Append(ToClientStartMatchTranslation(toClientData));
                    break;
                case ToClientMessageType.Frame:
                    translation.Append(ToClientFrameTranslation(toClientData));
                    break;
                case ToClientMessageType.Debug:
                    translation.Append(ToClientDebugTranslation(toClientData));
                    break;
                default:
                    break;
            }

            translation.Append(PACKET_DELIMITER);
            return translation.ToString();
        }

        private static string ToClientTimestampTranslation(DateTime timestamp)
        {
            // todo, not compatible
            return timestamp.Ticks.ToString();
        }

        private static string ToClientMessageTypeTranslation(ToClientMessageType type)
        {
            return ((int)type).ToString();
        }

        private static string ToClientDebugTranslation(ToClientData toClientData)
        {
            return toClientData.Message;
        }

        private static string ToClientStartMatchTranslation(ToClientData toClientData)
        {
            return toClientData.Message;
        }

        private static string ToClientFrameTranslation(ToClientData toClientData)
        {
            // frame~,player,inputs,by,number~,player2,inputs,by,number
            StringBuilder payload = new StringBuilder();

            // frame
            payload.Append(toClientData.FrameData.Frame);

            for (int i = 0; i < toClientData.FrameData.Input.Length; i++ )
            {
                payload.Append(FRAME_DELIMETER);

                GameInputType[] playerInput = toClientData.FrameData.Input[i];
                for (int j = 0; j < playerInput.Length; j++ )
                {
                    payload.Append(PLAYERINPUT_DELIMETER);
                    payload.Append((int)playerInput[j]);
                }
            }

            return payload.ToString();
        }

        #endregion

        // ***********************************************************
        // To Server Translations
        // ***********************************************************
        #region to server translations

        public static ToServerData Translate(string fromClient)
        {
            ToServerData data = new ToServerData();

            string[] parts = fromClient.Split(PACKET_DELIMITER);
            if (!ToServerValidatePacket(parts))
            {
                return null;
            }

            // <id>|timestamp|<type>|<payload>|<eom>
            string id = parts[0];
            string time = parts[1];
            string type = parts[2];
            string payload = parts[3];

            // set message type
            ToServerMessageType messageType;
            if (!Enum.TryParse<ToServerMessageType>(type, true, out messageType))
            {
                return null;
            }
            data.MessageType = messageType;

            // set timestamp
            long javascriptTime;
            if (!long.TryParse(time, out javascriptTime))
            {
                return null;
            }
            data.TimeStamp = ToServerTimestampTranslation(javascriptTime);

            // set message
            data.Message = payload;

            // populate data payload
            switch (messageType)
            {
                case ToServerMessageType.Frame:
                    ToServerFrameTranslation(data, payload);
                    break;

                case ToServerMessageType.Subscribe:
                case ToServerMessageType.Unsubscribe:
                case ToServerMessageType.QueueForMatch:
                case ToServerMessageType.CancelQueueForMatch:
                case ToServerMessageType.Debug:
                default:
                    break;
            }

            return data;
        }

        private static bool ToServerValidatePacket(string[] parts)
        {
            return parts.Length >= 4 && parts[0].Equals(GAME_ID);
        }

        private static DateTime ToServerTimestampTranslation(long webTimestamp)
        {
            return ORIGIN_TIME.AddMilliseconds(webTimestamp);
        }

        private static void ToServerFrameTranslation(ToServerData data, string payload)
        {
            // frame payload structure
            // frame~player,inputs,by,number
            string[] tokens = payload.Split(FRAME_DELIMETER);
            if (tokens.Length == 2)
            {
                // parse list of player inputs
                string[] inputs = tokens[1].Split(PLAYERINPUT_DELIMETER);
                List<GameInputType> gameInputs = new List<GameInputType>();
                for (int i = 0; i < inputs.Length; i++)
                {
                    if (!string.IsNullOrEmpty(inputs[i]))
                    {
                        gameInputs.Add((GameInputType)Convert.ToInt32(inputs[i]));
                    }
                }

                // Input: 1st-dimension is always length 1 (only one player is being considered)
                data.FrameData = new FrameData()
                {
                    Frame = Convert.ToUInt16(tokens[0]),
                    Input = new[] { gameInputs.ToArray() }
                };
            }
        }

        #endregion
    }
}
