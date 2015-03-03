using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace ServerLib
{
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
