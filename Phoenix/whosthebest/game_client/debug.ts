/// <reference path="references.ts" />
module Debug
{
    export var log = (message) =>
    {
        console.log("[debug]" + message);
    }
}
Debug.log("debug.ts");
