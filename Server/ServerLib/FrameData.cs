using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.Text;

namespace ServerLib
{
    [DataContract]
    public class FrameData
    {
        ushort frame;
        GameInputType[][] input;

        [DataMember]
        public ushort Frame
        {
            get { return frame; }
            set { frame = value; }
        }

        [DataMember]
        public GameInputType[][] Input
        {
            get { return input; }
            set { input = value; }
        }
    }

    [DataContract]
    public enum GameInputType
    {
        [EnumMember]
        None = 0,

        [EnumMember]
        Up,

        [EnumMember]
        Down,

        [EnumMember]
        Left,

        [EnumMember]
        Right,

        [EnumMember]
        Swap,

        [EnumMember]
        Elevate,
    }
}
