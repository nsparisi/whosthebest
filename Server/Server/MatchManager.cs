using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Server
{
    public sealed class MatchManager
    {
        List<Match> activeMatches;
        List<Player> playersNotInMatch;

        object syncLock = new Object();

        private static readonly MatchManager instance = new MatchManager();
        public static MatchManager Instance
        {
            get
            {
                return instance;
            }
        }

        public MatchManager()
        {
            activeMatches = new List<Match>();
            playersNotInMatch = new List<Player>();
        }

        public void FindAppropriatePlayerForMatch(Player player)
        {
            lock (syncLock)
            {
                Debug.Log(this.GetType(), string.Format("FindAppropriatePlayerForMatch .. count {0}", playersNotInMatch.Count));

                if(playersNotInMatch.Contains(player))
                {
                    Debug.Log(this.GetType(), string.Format("{0} is already queued. Ignoring.", player.Name));
                    return;
                }

                Player opponent = null;
                if (playersNotInMatch.Any())
                {
                    opponent = playersNotInMatch.First();
                    playersNotInMatch.Remove(opponent);

                    if(!opponent.Contract.IsConnectionActive())
                    {
                        opponent = null;
                        Debug.Log(this.GetType(), string.Format("Found opponent, but connection lost {0}", opponent.Name));
                    }
                    else
                    {
                        Debug.Log(this.GetType(), string.Format("Found opponent! {0}", opponent.Name));
                    }
                }

                if (opponent == null)
                {
                    Debug.Log(this.GetType(), string.Format("No opponent, adding {0} to queue", player.Name));
                    playersNotInMatch.Add(player);
                }
                else
                {
                    // begin new match
                    Debug.Log(this.GetType(), string.Format("Creating match."));
                    Match match = CreateMatch(player, opponent);
                    player.Contract.AddedToMatch(match);
                    opponent.Contract.AddedToMatch(match);
                }
            }
        }

        public void RemovePlayerWaitingForMatch(Player player)
        {
            lock (syncLock)
            {
                Debug.Log(this.GetType(), string.Format("Removing {0} from queue.", player.Name));
                if (playersNotInMatch.Contains(player))
                {
                    playersNotInMatch.Remove(player);
                }
            }
        }

        public Match CreateMatch(Player player1, Player player2)
        {
            lock (syncLock)
            {
                Match match = new Match(new[] { player1, player2 });
                activeMatches.Add(match);
                return match;
            }
        }
    }
}
