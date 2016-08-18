/// <reference path="references.ts" />
module Debug
{
    export var log = (message) =>
    {
        console.log("[debug]" + message);
    }
    
    export var logError = (message) =>
    {
        console.log("[error]" + message);
    }
}
Debug.log("debug.ts");
