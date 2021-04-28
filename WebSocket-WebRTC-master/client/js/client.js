// ==============业务逻辑代码==========================
/* 定义变量 */
// 用户名
/*获取url中的变量*/
var roomid = getQueryString('room');
var userName = getQueryString('name');
if(!roomid||!userName){
  alert('检测url上无房间号或者无用户名，并赋予默认值！');
  /*当前页面打开该url*/
  /*protocol:协议，此处为http*/
  /*host:主机*/
  window.location.href = window.location.protocol+'//'+window.location.host+`?room=${roomid||'10'}&name=${userName||'aaa'}`
}
// websocket 实例
var chatSocket;
// 获取摄像头和音频配置
var mediaConstraints = {"audio": true,"video": true};
// 视频盒子,video标签外面的div标签
var videoBox = document.getElementById('videoBox');
// 本地视频对象,video标签
var localVideo = document.getElementById('localVideo');
// 文本消息盒子
var textBox = document.getElementById('textBox');
// 提交文本消息按钮
var textMsg = document.getElementById('textMsg');
// 本地流
var localStream = null;
// 存储用户对象
var peerList = {};
//数据传输DataChannel
var dataChannels = {};

// 初始化websocket
websocketInit();
// 显示本地视频 并且加入房间
getUserMedia();


var incomingFileData;
var bytesReceived;
var downloadInprogress = false;
var mime;
var fileName;
// =================websocket====================
//创建websocket对象，用于与websocket服务器端通信
async function  websocketInit() {
  try {
    // 浏览器提供 WebSocket 对象
    /*ReconnectingWebSocket 是一个小型的 JavaScript 库，封装了 WebSocket API 提供了在连接断开时自动重连的机制*/
     // websocket连接地址
     // chatSocket = await new ReconnectingWebSocket('wss://www.lalila.top:3000');
      chatSocket = await new ReconnectingWebSocket('wss://localhost:3000');

  } catch (error) {
    console.log('发生错误：'+error);
  }

  // 监听消息
  chatSocket.onmessage = function(evt) {
      try {
          var msg = JSON.parse(evt.data);
          switch(msg.type) {
              case "joined":
                  userJoined(msg.userList, msg.userName);
                  var p = document.createElement('p');
                  p.innerText = msg.userName+' 加入了房间';
                  p.className = 'p-hint';
                  textBox.append(p);
                  break;
              case "__ice_candidate":
                  //如果是一个ICE的候选，则将其加入到PeerConnection中
                  if (msg.candidate) {
                      peerList[msg.account] && peerList[msg.account].addIceCandidate(msg.candidate).catch(() => {}
                      );
                  }
                  break;
              case "error":
                  alert(msg.msg);
                  break;
              /*case "text":
                var p = document.createElement('p');
                p.innerText = msg.userName+': '+msg.text;
                textBox.append(p);
                break;*/
              // 信令消息:这些消息用于在视频通话之前的谈判期间交换WebRTC信令信息。
              case "video-offer":  // 发送 offer
                  handleVideoOfferMsg(msg);
                  break;
              case "video-answer":  // Callee已经答复了我们的报价
                  peerList[msg.account] && peerList[msg.account].setRemoteDescription(msg.sdp, function(){}, () => {});
                  break;
              case "disconnected": // 有人挂断了电话
                  console.log(msg.account);
                  let dom = document.querySelector('#' + [msg.account, userName].sort().join('-'));
                  if (dom) {
                      dom.remove();
                      var p = document.createElement('p');
                      p.innerText = msg.account+' 退出了房间';
                      p.className = 'p-hint';
                      textBox.append(p);
                  }
                  break;
              case "start": //有人准备发送文件,提前发来文件信息
                  console.log("接收到其他用户的文件",msg);
                  incomingFileData = [];
                  bytesReceived = 0;
                  downloadInprogress = true;
                  fileName = msg.fileName;
                  break;
              case "file":
                  var data = msg.data;
                  var arr = data.split(',');
                  mime = arr[0].match(/:(.*?);/)[1];
                  incomingFileData += atob(arr[1]);
                  var n = incomingFileData.length;
                  var u8arr = new Uint8Array(n);
                  while(n--){
                      u8arr[n] = incomingFileData[n];
                  }
                  var b = new Blob([u8arr],{type:mime});
                  var l = document.createElement('a');
                  l.href = URL.createObjectURL(b);
                  l.download = fileName;
                  l.textContent = fileName;
                  l.style.display = 'block';
                  textBox.append(l);
                  // var blob = new Blob([data]);
                  // var f = new FileReader();
                  // var u8;
                  // f.onload = function (e){
                  //     u8 = new Uint8Array(e.target.result);
                  // };
                  // f.readAsArrayBuffer(blob);
                  // bytesReceived += u8.length;
                  // incomingFileData.push(u8);
                  // if (bytesReceived === incomingFileInfo.fileSize){
                  //     var blob = new Blob(incomingFileData);
                  //     incomingFileData = [];
                  //     var link = document.createElement('a');
                  //     /*window.URL.createObjectURL()把blob转化为下载的链接*/
                  //     link.href = URL.createObjectURL(blob);
                  //     link.download = incomingFileInfo.fileName;
                  //     link.textContent = incomingFileInfo.fileName;
                  //     link.style.display = 'block';
                  //     textBox.append(link);
                  // }
                  break;
              // case "end":
              //     console.log("文件已经全部接收");
              //     var n = incomingFileData.length;
              //     var u8arr = new Uint8Array(n);
              //     while(n--){
              //         u8arr[n] = incomingFileData[n];
              //     }
              //     var blob = new Blob([u8arr],{type:mime});
              //     var link = document.createElement('a');
              //     link.href = URL.createObjectURL(blob);
              //     link.download = fileName;
              //     link.textContent = fileName;
              //     link.style.display = 'block';
              //     textBox.append(link);
              //     break;
              // 未知的信息;输出到控制台进行调试。
              default:
                  console.log("未知的信息收到了:");
                  console.log(msg);
          }
      }catch (e) {
          var formdata = evt.data;
          var blob = formdata.get('file');
          var link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          link.textContent = fileName;
          link.style.display = 'block';
          textBox.append(link);
      }

  };
  //连接成功建立的回调方法
  chatSocket.onopen = function (event) {
    console.log("onopen:websocket连接成功");
  }
  //连接关闭的回调方法
  chatSocket.onclose = function () {
    chatSocket.close();
    console.log("websocket.onclose");
  }
  //连接发生错误的回调方法
  chatSocket.onerror = function () {
    console.log("chatSocket.error");
  };
  window.onbeforeunload = function () {
    chatSocket.close();
  }
}
// 监听用户加入
/*让每一个用户都与自己进行getPeerConnection*/
/*data:userLIst,account:username*/
function userJoined(data, account) {
  console.log(data);
  // 当大于一个与用户时
  if (data.length> 1) {
    /*forEach调用数组的每一个元素,把元素传递给回调函数*/
    data.forEach(v => {
      let obj = {};
      let arr = [v, userName];
      /*sort排序,join用—间隔,然后放入一个字符串:为了保证与每一个用户都有连接，但是不会重复连接*/
      obj.account = arr.sort().join('-');
      if (!peerList[obj.account] && v !== userName) {
        getPeerConnection(obj);
      }
    });
    // 当房间有人存在则向房间其它人发offer
    if (account === userName) {
      // console.log('account', account);
      for (let k in peerList) {
        createOffer(k, peerList[k]);
      }
    }
  }
}
// 发送消息
function sendMessage(msg) {
  msg.roomid = roomid;
  //JSON.stringify()将js对象转换为json对象
  chatSocket.send(JSON.stringify(msg));
}







// =============================webRTC===================
// 获取本地流
async function getUserMedia() {
    console.log("尝试获取用户摄像头权限");
  try {
    localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    localVideo.srcObject = localStream;
    sendMessage({
      userName: userName,
      type: 'join'
    });
    console.log("向服务器发送join信息");
  } catch (error) {
    console.log('获取本地摄像头失败：'+error);
  }
}
// 创建 RTCPeerConnection
function getPeerConnection(v) {
  console.log('getPeerConnection');
  let iceServer = {
    "iceServers": [
      {
        "url": "stun:stun.l.google.com:19302"
      }
    ],
    sdpSemantics:'plan-b'
  };
  // 创建
  var peer = new RTCPeerConnection(iceServer,{optional: [{RtpDataChannels: true}]});
    // var peer = new RTCPeerConnection(iceServer);
  //向 RTCPeerConnection 中加入需要发送的流
  peer.addStream(localStream);
  // 判断使用哪个方法监听流
  var hasAddTrack = (peer.addTrack !== undefined);
  // 如果检测到媒体流连接到本地，将其绑定到一个video标签上输出
  if (hasAddTrack) {
    peer.ontrack = (event) => {
      let videos = document.querySelector('#' + v.account);
      if (videos) {
        videos.srcObject = event.streams[0];
      } else {
        let video = document.createElement('video');
        video.controls = true;
        video.autoplay = 'autoplay';
        video.srcObject = event.streams[0];
        video.id = v.account;
        video.className = 'col-md-4';
        videoBox.append(video);
      }
    }
  } else {
    peer.onaddstream = (event) => {
      let videos = document.querySelector('#' + v.account);
      if (videos) {
        videos.srcObject = event.stream;
      } else {
        let video = document.createElement('video');
        video.controls = true;
        video.autoplay = 'autoplay';
        video.srcObject = event.stream;
        video.id = v.account;
        video.className = 'col-md-4';
        videoBox.append(video);
      }
    };
  }
  //发送ICE候选到其他客户端
  peer.onicecandidate = (event) => {
    if (event.candidate) {
      sendMessage({
        type: '__ice_candidate',
        candidate: event.candidate,
        account: v.account
      });
    }
  };

  // peer.ondatachannel = (event) =>{
  //     var receiveChannel = event.channel;
  //     console.log("datachannel is created!");
  //     receiveChannel.onmessage = (event) =>{
  //         console.log("ondatachannel:",event.data);
  //     }
  // }
  openDataChannel(peer,v);
  peerList[v.account] = peer;
}
//创建用于数据传输的DataChannel
/*接收文件的变量*/
var currentFile = [],
    currentFileMeta,
    currentFileName;
/*网站方法需要的变量*/
var incomingFileInfo;
// var incomingFileData;
// var bytesReceived;
// var downloadInprogress = false;
function openDataChannel(peer,v) {
    var dataChannelOptions = {
      reliable: true,
      ordered: true
    };
    dataChannel = peer.createDataChannel("myLabel",dataChannelOptions);
    dataChannel.onerror = function (error) {
        console.log("DataChannel Error: ",error);
    };
    dataChannel.onmessage = function (event) {
      console.log(event.data);
      try{
          console.log("datachannel传来信息");
          var message = JSON.parse(event.data);
          console.log("信息为:",message);
          switch (message.type){
              case "start":
                  console.log("接收到其他用户的文件");
                  currentFile = [];
                  // 文件格式(file.type)
                  currentFileMeta = message.data;
                  currentFileName = message.name;
                  console.log("Receiving file",currentFileMeta);
                  break;
              case "end":
                  console.log("接收完毕");
                  saveFile(currentFileMeta,currentFile);
                  break;
              case "message":
                  var p = document.createElement('p');
                  p.innerText = message.data;
                  textBox.append(p);
                  break;
              default:
                  console.log("dataChannel传来其他信息:",message);
                  break;
          }
      }catch (e){
          console.log("error:",e);
          var blob = event.data;
          var link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          link.textContent = fileName;
          link.style.display = 'block';
          textBox.append(link);
          console.log("正在接收其他用户的文件");
          // currentFile.push(event.data);
      }
      // try{
      //   var message = JSON.parse(event.data);
      //   switch (message.type) {
      //     case "start":
      //       console.log("接收到其他用户的文件");
      //       currentFile = [];
      //  文件格式(file.type)
      //       currentFileMeta = message.data;
      //       console.log("Receiving file",currentFileMeta);
      //       break;
      //     case "end":
      //       console.log("接收完毕");
      //       saveFile(currentFileMeta,currentFile);
      //       break;
      //   }
      // }catch (e) {
      //   console.log(e);
      //   console.log("正在接收其他用户的文件");
      //   currentFile.push(event.data);
      // }
        /*var data = event.data;
        if (data instanceof Blob){
            console.log("接收到Blob类型数据");
            // try{
            //     incomingFileInfo = JSON.parse(event.data);
            //     switch (incomingFileInfo.type) {
            //         case "start":
            //             console.log("接收到其他用户的文件",incomingFileInfo.fileName);
            //             incomingFileData = [];
            //             bytesReceived = 0;
            //             downloadInprogress = true;
            //             break;
            //     }
            // }catch (e) {
                bytesReceived += data.length;
                incomingFileData.push(data);
                if (bytesReceived === incomingFileInfo.fileSize){
                    var blob = new Blob(incomingFileData);
                    incomingFileData = [];
                    var link = document.createElement('a');
                    /!*window.URL.createObjectURL()把blob转化为下载的链接*!/
                    link.href = URL.createObjectURL(blob);
                    link.download = incomingFileInfo.fileName;
                    link.textContent = incomingFileInfo.fileName;
                    link.style.display = 'block';
                    textBox.append(link);
                }
            // }
        }else if (data instanceof ArrayBuffer){
            console.log("接收到ArrayBuffer类型数据");
            // try{
            //     incomingFileInfo = JSON.parse(event.data);
            //     switch (incomingFileInfo.type) {
            //         case "start":
            //             console.log("接收到其他用户的文件",incomingFileInfo.fileName);
            //             incomingFileData = [];
            //             bytesReceived = 0;
            //             downloadInprogress = true;
            //             break;
            //     }
            // }catch (e) {
            bytesReceived += data.length;
            incomingFileData.push(data);
            if (bytesReceived === incomingFileInfo.fileSize){
                var blob = new Blob(incomingFileData);
                incomingFileData = [];
                var link = document.createElement('a');
                /!*window.URL.createObjectURL()把blob转化为下载的链接*!/
                link.href = URL.createObjectURL(blob);
                link.download = incomingFileInfo.fileName;
                link.textContent = incomingFileInfo.fileName;
                link.style.display = 'block';
                textBox.append(link);
            }
        }else{
            console.log("接收到String类型变量");
            var p = document.createElement('p');
            p.innerText = data;
            textBox.append(p);
        }
*/
      /*var p = document.createElement('p');
      p.innerText = event.data;
      textBox.append(p);*/
    };
    dataChannel.onopen = function () {

    };
    dataChannel.onclose = function () {
        console.log("DataChannel is closed");
    };
    dataChannels[v.account] = dataChannel;
}
// createOffer
function createOffer(account, peer) {
  //发送offer，发送本地session描述
  peer.createOffer({
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  }).then((desc) => {
    peer.setLocalDescription(desc, () => {
      sendMessage({
        type: 'video-offer',
        sdp: peer.localDescription,
        account: account
      });
    });
  });
}
// 收到offer请求
function handleVideoOfferMsg(v) {
  peerList[v.account] && peerList[v.account].setRemoteDescription(v.sdp, () => {
    peerList[v.account].createAnswer().then((desc) => {
        // console.log('send-answer', desc);
        peerList[v.account].setLocalDescription(desc, () => {
          sendMessage({
            type: 'video-answer',
            sdp: peerList[v.account].localDescription,
            account: v.account
          });
        });
    });
  }, () => {});
}






// ==============================其他方法==================
// 根据url 获取用户名和房间号创建多人视频聊天室 http://localhost:3001/?room=10&name=abc
function getQueryString(name) {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
  var r = window.location.search.substr(1).match(reg);
  if (r != null) return unescape(r[2]);
  return null;
}

//保存文件
// currentFileMeta:file.type  currentFile:file of base64
function saveFile(currentFileMeta,currentFile) {
    console.log("保存数据的数组长度:",currentFile.length);
    var i;
    // for (i=0;i<currentFile.length;i++){
    //     console.log(i);
    //     console.log("base64形式:",currentFile[i]);
    //     console.log("字符形式:",atob(currentFile[i]));
    // }
    var blob = base64ToBlob(decodeURIComponent(atob(currentFile)),currentFileMeta);
    var link = document.createElement('a');
    /*window.URL.createObjectURL()把blob转化为下载的链接*/
    link.href = window.URL.createObjectURL(blob);
    link.download = "test.txt";
    link.innerText = "test.txt";
    link.style.display = 'block';
    textBox.append(link);
}

//文件解码函数
//b64Data:file's data of base64, contentType:type of file
function base64ToBlob(b64Data,contentType) {
  var byteArrays = [],byteNumbers,slice;
  for(var i = 0;i<b64Data.length;i++){
      console.log(i);
    slice = b64Data[i];
    byteNumbers = new Array(slice.length);
    for (var n = 0;n<slice.length;n++){
        /*charCodeAt:返回指定位置的字符的 Unicode 编码*/
      byteNumbers[n] = slice.charCodeAt(n);
      console.log("Unicode编码:",slice.charCodeAt(n));
    }
    var byteArray = new Uint8Array(byteNumbers);
    console.log("转换内容:",byteArray);
    byteArrays.push(byteArray);
  }
  var blob = new Blob(byteArrays,{type:contentType});
  return blob;
}

// 点击按钮发送消息
function sendTextMsg(){
  if(textMsg.value){
    /*sendMessage({
      type: 'text',
      userName: userName,
      text: textMsg.value
    });*/
      var message = userName+': '+textMsg.value;
    for (let k in dataChannels) {
      dataChannels[k].send(JSON.stringify({
          type:"message",
          data:message
      }));
    }
    var p = document.createElement('p');
    p.innerText = userName+': '+textMsg.value;
    textBox.append(p);
    textMsg.value = '';
  }
}






//点击发送文件
function getFile() {
    console.log("getFile-----starts");
  // 文件盒子
   file = document.getElementById('files').files[0];
   console.log("sendfile type:",file.type,",name:",file.name);
  if(file.size > 0){
    for (let k in dataChannels) {
      dataChannels[k].send(JSON.stringify({
            type: "start",
            data: file.type,
            name: file.name
      }));
      sendFile(file,dataChannels[k]);
    }
  }
}

//发送文件
var CHUNK_MAX = 64;
function sendFile(file,dataChannel) {
  console.log("sendFile---starts");
  console.log("文件内容:",file);
    var reader = new FileReader();
    reader.onloadend = function (evt) {
      console.log("开始发送文件");
      /*确认FileReader的对象再DONE的状态*/
      if (evt.target.readyState == FileReader.DONE){
        /*reader.result为文件内容*/
        var buffer = reader.result,
            start = 0,
            end = 0,
            last = false;
        function sendChunk() {
            console.log("发送------------------------");
          end = start+CHUNK_MAX;
          console.log(start,end);
          if (end>file.size){
            end = file.size;
            last = true;
          }
          dataChannel.send(arrayBufferToBase64(buffer.slice(start,end)));
          if (last == true){
            dataChannel.send(JSON.stringify({
              type:"end"
            }));
          }
          else {
            start = end;
            /*防止数据溢出*/
              sendChunk();
            // setTimeout(function () {
            //   sendChunk();
            // },10000);
          }
        }
        sendChunk();
      }
    };
    /*用于启动读取指定的 Blob 或 File 内容。当读取操作完成时，readyState 变成 DONE（已完成），并触发 loadend 事件，同时 result 属性中将包含一个 ArrayBuffer 对象以表示所读取文件的数据。*/
    reader.readAsArrayBuffer(file);
}




//判断是否有FileApi
function hasFileApi() {
  return window.File && window.FileReader && window.FileList && window.Blob;
}

//文件编码函数
function arrayBufferToBase64(buffer) {
    console.log("arraryBuffer:",buffer);
    var binary = "";
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i=0;i<len;i++){
        /*String.fromCharCode:将 Unicode 编码转为一个字符*/
      binary += String.fromCharCode(bytes[i]);
    }
    console.log("字符:",binary);
    console.log("base64:",window.btoa(encodeURIComponent(binary)));
    /*btoa:将其转化为用于网络传输的base64编码*/
    return window.btoa(encodeURIComponent(binary));
}

//https://webrtc.org.cn/webrtc-tutorial-filetransfer/ 发送文件方式


var deliverSize = 0;
function sendFiles2() {
    file = document.getElementById('files').files[0];
    currentChunk = 0;
    console.log("file size:",file.size);
    /*send some metadata about file to the receiver*/
    sendMessage({
        type: "start",
        fileName: file.name,
        fileSize: file.size
    })
    // for (let k in dataChannels) {
    //     dataChannels[k].send(JSON.stringify({
    //         type: "start",
    //         fileName: file.name,
    //         fileSize: file.size
    //     }));
    //
    // }
    readNextChunk();
}

function readNextChunk() {
    var start = BYTES_PER_CHUNK * currentChunk;
    var end = Math.min(file.size,start+BYTES_PER_CHUNK);
    console.log("start:",start);
    fileReader.readAsText(file.slice(start,end));
    // fileReader.readAsArrayBuffer(file.slice(start,end));
}

fileReader.onload = async e => {
    chatSocket.send({
        type: "file",
        data: e.target.result
    });
    // if (fileReader.readyState === 2){
    // for (let k in dataChannels) {
    //     console.log("向接收端发送数据-----------------------------------");
    //     // await dataChannels[k].send(e.target.result);
    //     // var a = new ArrayBuffer(1);
    //     chatSocket.send({
    //         type: file,
    //         data: e.result
    //     });
    //     // dataChannels[k].send(e.target.result);
    //     // dataChannels[k].send(arrayBufferToBase64(fileReader.result));
    //     // deliverSize += arrayBufferToBase64(fileReader.result).length;
    //     deliverSize += e.target.result.byteLength;
    //     console.log("已经传输的文件大小为:", deliverSize);
    // }
    currentChunk++;
    if (BYTES_PER_CHUNK * currentChunk < file.size) {
        readNextChunk();
    }else{
        chatSocket.send({
            type: "fileEnd"
        })
    }
    // }

};
var BYTES_PER_CHUNK = 512;
var currentChunk;
// var fileReader = new FileReader();
var file;
var START = 0;
var END = START;
//将文件转化成base64格式，然后用JSON传输，在其他用户处反处理
function sendFileButton(){
    file = document.getElementById('files').files[0];
    console.log("开始发送文件,文件信息为:",file);
    currentChunk = 0;
    /*send some metadata about file to the receiver*/
    // chatSocket.send(file);
    sendMessage({
        type: "start",
        fileName: file.name
    });
    sendFile3();
}
function sendFile4(){
    var formData = new FormData();
    formData.append('file',file);
    formData.append('roomid',roomid);
    chatSocket.send(formData);
}
function sendFile3(){
    var p = new Promise(function (resolve, reject){
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (e){
            resolve(e.target.result);
        }
    });
    p.then(function (res){
        sendMessage({
            type:"file",
            data:res
        });
        console.log("文件发送完毕");
        // if (START<file.size){
        //     sendFile3();
        // }else {
        //     sendMessage({
        //         type: "end"
        //     });
        //     console.log("文件发送完毕")
        // }
    })
}