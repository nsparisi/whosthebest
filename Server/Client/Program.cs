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
            // player sends random data at fps
            // Client p 20
            if (args.Length == 2 && args[0].Equals("p"))
            {
                Console.Out.WriteLine("Constructing Player...");
                using (PlayerConnection connection = new PlayerConnection())
                {
                    Console.WriteLine("Press <ENTER> to look for match.");
                    Console.ReadLine();
                    connection.QueueForMatch();
                    connection.StartTestFast(Convert.ToInt32(args[1]));
                }
            }

            // player send manual data on key press
            // Client p
            else if (args.Length == 1 && args[0].Equals("p"))
            {
                Console.Out.WriteLine("Constructing Player...");
                using (PlayerConnection connection = new PlayerConnection())
                {
                    Console.WriteLine("Press <ENTER> to look for match.");
                    Console.ReadLine();
                    connection.QueueForMatch();
                    connection.StartTestInput();
                }
            }

            // web request
            else
            {
                // web server
                using (PlayerConnection connection = new PlayerConnection())
                {
                    Console.ReadLine();
                    connection.QueueForMatch();
                    connection.StartFromWeb();
                }
            }
        }
    }
}
