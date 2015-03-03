using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Server
{
    public class Player
    {
        public string Name { get; set; }
        public Guid Id { get; private set; }
        public ServiceContract Contract { get; private set; }

        public Player(ServiceContract contract)
        {
            this.Id = Guid.NewGuid();
            this.Contract = contract;
            this.Name = "Player Default";
        }

        public Player(ServiceContract contract, string name)
            : this(contract)
        {
            this.Name = name;
        }
    }
}
