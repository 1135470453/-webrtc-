var weSocket = require('ws');
var express = require('express'),
    app = express();
var httpServer = require('http').createServer(app);
app.use('/',express.static(__dirname+'/static'));
httpServer.listen(2999,function (){
    console.log("Server is listening on port 2999");
})
var wsServer = new WebSocketServer({
    server: httpServer
});

if (!wsServer){
    console.log("错误:创建webSocket错误!");
}

wsServer.on('connection',(ws) =>{
    console.log("有用户连接服务器");
    ws.on('message',(message)=>{
        msg = JSON.parse(message);
        switch(msg.type){
            case "name":
                console.log("客户端发来name");
            case "age":
                console.log("客户端发来age");
            default:
                console.log("客户端发来其他");
        }
    });
    ws.on('close',function (reason,description){
        console.log("客户端断开:");
        console.log("reason:",reason,",description:",description);
    })
})