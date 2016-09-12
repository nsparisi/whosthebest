/// <reference path="references.ts" />

/**
 * Provides a seed-capable random number generator.
 */
class RandomNumberGenerator
{
    constructor(public seed: number)
    {
        if(!seed)
        {
            seed = Math.ceil(Math.random() * 100000);
        }
        else if(seed <= 0)
        {
            throw new Error("RNG seed cannot be <= 0");
        }
        
        this.seed = Math.ceil(seed);
    }
    
    next() : number
    {
        var x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
}