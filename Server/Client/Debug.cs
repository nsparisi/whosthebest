using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Client
{
    public static class Debug
    {
        public static void Log(Type caller, string format, params object[] args)
        {
            // Console.Out.WriteLine(string.Format("[{0}]", caller.GetType()) + string.Format(format, args));
        }
    }
}
