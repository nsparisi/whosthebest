using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Client.ServiceReference;
using ServerLib;

namespace Client
{
    class Program
    {
        static void Main(string[] args)
        {
            // web server
            using (PlayerConnection connection = new PlayerConnection())
            {
                connection.StartFromWeb();
            }
        }
    }
}
