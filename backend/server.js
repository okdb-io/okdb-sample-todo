const OkdbServer = require("okdb-server");

// create and start server on 7899 port by default
const options = {
    cors: {
        enabled: true
    }
}
const okdb = new OkdbServer(options);

// sample authentication, e.g. should validate your own auth token
okdb.handlers().auth((token) => {
    if(token === "12345") {
        return { id: "1", name: "User"}
    }    
    return null;
});

// Handling Ctrl-C (workaround for Windows)
if (process.platform === "win32") {
    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on("SIGINT", function () {
        process.emit("SIGINT");
    });
}
//graceful shutdown on Ctrl-C (all other platforms)
process.on("SIGINT", function () {    
    okdb.stop(()=> {
        console.log("server stopped");
        process.exit();
    });
});