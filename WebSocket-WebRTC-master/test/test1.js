//创建http服务器
var http = require('http');
http.createServer(function (request,response){
    response.writeHead(200,{'Content-Type':'text/plain'});
    response.end("helllo world");
}).listen(3000);
console.log("http server listens at http://127.0.0.1:3000/");

//回调实现异步
var fs = require('fs');
fs.readFileSync(__dirname+'/test.txt',function (err,data){
    if (err){
        console.error(err);
    }else {
        console.log("data:",data);
    }
});
console.log("读文件程序");

var object = {
    name:'tom',
    age:'20',
    talk: function (){
        console.log("I am "+this.name);
    }
}
object.talk();
function objectFunction(){
    var name = 'jerry';
    this.tell = function (){
        console.log("I am "+name); 
    }
}

var jerry = new objectFunction();
jerry.tell();

module.exports.lalila = function (){

}