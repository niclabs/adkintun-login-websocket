var http = require("http");
var WebSocketServer = require('ws').Server
var uuid = require('node-uuid');

var ipaddress = "SERVER_IP";
var port = 1234;

var server = http.createServer(function(request, response) {

    response.writeHead(200, {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
    });


    process.on('uncaughtException', function(err) {
        response.end("Exception");
    });

    try {
        if (request.method == "POST") {
            var url = request.url;
            if (url == "/auth") {

                var body = '';
                request.on('data', function(chunk) {
                    body += chunk.toString();
                    console.log(body);
                });

                request.on('end', function() {
                    var params = JSON.parse(body);
                    var uuId = params["uuid"];
                    var accessToken = params["access_token"];
                    console.log(params);
                    console.log(accessToken);

                    var msg = {
                        'op': 'authdone',
                        'accessToken': accessToken
                    };
                    console.log(msg);
                    if (clients[uuId] != undefined || clients[uuId] != null) {
                        clients[uuId].send(JSON.stringify(msg), {
                            mask: false
                        });
                        delete clients[uuId];
                        response.end('{"status":"OK"}');

                    } else
                        response.end('{"status":"NOK"}');
                });
            } else 
                response.end('{"status":"NOK"}');
        } else 
            response.end("NOT Supported");
    } catch (e) 
        response.end("Exception");

}).listen(port, ipaddress);

var wss = new WebSocketServer({
    path: '/gencode',
    server: server,
    autoAcceptConnections: false
});


var clients = {};

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        var obj = JSON.parse(message);
        if (obj.op == 'hello') {
            var uuidToken = uuid.v1();
            clients[uuidToken] = ws;
            var hello = {
                op: 'hello',
                token: uuidToken
            };
            ws.send(JSON.stringify(hello), {
                mask: false
            });
        }
    });
});
