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
            if (args.Length == 2 && args[0].Equals("p"))
            {
                Console.Out.WriteLine("Constructing Player...");
                using (PlayerConnection connection = new PlayerConnection())
                {
                    Console.WriteLine("Press <ENTER> to look for match.");
                    Console.ReadLine();
                    connection.LookForMatch();

                    connection.StartTestFast(Convert.ToInt32(args[1]));
                }
            }

            else if (args.Length == 1 && args[0].Equals("r"))
            {
                Console.Out.WriteLine("Constructing Receiver...");

                using (Receiver receiver = new Receiver())
                {
                    Console.WriteLine("Listening...");
                    Console.WriteLine("Press <ENTER> to terminate.");
                    Console.WriteLine();
                    Console.ReadLine();
                }
            }

            else if (args.Length == 1 && args[0].Equals("p"))
            {
                Console.Out.WriteLine("Constructing Player...");
                using (PlayerConnection connection = new PlayerConnection())
                {
                    Console.WriteLine("Press <ENTER> to look for match.");
                    Console.ReadLine();
                    connection.LookForMatch();

                    connection.StartTestInput();
                }
            }
            else
            {
                // web server
                using (PlayerConnection connection = new PlayerConnection())
                {
                    Console.ReadLine();
                    connection.LookForMatch();
                    connection.StartFromWeb();
                }
            }
        }
    }
}
