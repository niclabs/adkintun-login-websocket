var http = require("http");
var WebSocketServer = require('ws').Server
const uuidV1 = require('uuid/v1');
var winston = require('winston');
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File, { filename: 'tmp/login-ws-adk.log' })({
      timestamp: function() {
        return Date.now();
      },
      formatter: function(options) {
        // Return string will be passed to logger.
        return options.timestamp() +' '+ options.level.toUpperCase() +' '+ (options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
      }
    })
  ]
});
logger.info('Data to log.');
var ipaddress = "0.0.0.0";
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
                    logger.info(body);
                });

                request.on('end', function() {
                    var params = JSON.parse(body);
                    var uuId = params["uuid"];
                    var accessToken = params["access_token"];
                    logger.info(params);
                    logger.info(accessToken);

                    var msg = {
                        'op': 'authdone',
                        'accessToken': accessToken
                    };
                    logger.info(msg);
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
    } catch (e) {
        response.end("Exception");
    }
}).listen(port, ipaddress);

var wss = new WebSocketServer({
    path: '/gencode',
    server: server,
    autoAcceptConnections: false
});


var clients = {};

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        logger.info('received: %s', message);
        var obj = JSON.parse(message);
        if (obj.op == 'hello') {
            var uuidToken = uuidV1();
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
