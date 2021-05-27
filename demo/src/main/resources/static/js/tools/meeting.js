//用户自己输入,在会议房间中显示的名称
var userName = getQueryString("userName");
//服务器随机产生,用于辨别用户身份的六位数字
var userId;
var roomId = getQueryString("roomId");
//websocket实例
var chatSocket;
//摄像头和音频设置
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


//初始化websocket
websocketInit();
//显示本地视频并且加入房间
getUserMedia();

/*
websocket连接及相关工具函数
*/
//建立websocket连接
async function websocketInit() {
    try{
        chatSocket = await new ReconnectingWebSocket('ws://127.0.0.1:8080/meetingWebSocket');
    }catch (error) {
        console.log("发生错误:"+error);
    }
    chatSocket.onmessage = function (evt) {
        var msg = JSON.parse(evt.data);
        switch (msg.type) {
            case "userId":
                userId = msg.userId;
                break;
            case "joined":
                console.log("websocket.joined");
                console.log(msg.userList,msg.userId)
                userJoined(msg.userList, msg.userId);
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
            default:
                console.log("未知的信息收到了:");
                console.log(msg);
        }
    }
    chatSocket.onopen = function () {
        console.log("onopen:websocket连接成功");
    }
    chatSocket.onclose = function () {
        chatSocket.close();
        console.log("websocket.onclose");
    }
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
    // 当大于一个与用户时(房间中不只有自己一个用户的时候)
    if (data.length> 1) {
        /*forEach调用数组的每一个元素,把元素传递给回调函数*/
        data.forEach(v => {
            let obj = {};
            let arr = [v, userId];
            /*sort排序,join用—间隔,然后放入一个字符串:为了保证与每一个用户都有连接，但是不会重复连接*/
            obj.account = arr.sort().join('-');
            if (!peerList[obj.account] && v !== userId) {
                getPeerConnection(obj);
            }
            // 当加入的人是自己则向房间其它人发offer
            if (account === userId) {
                for (let k in peerList) {
                    createOffer(k, peerList[k]);
                }
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
//利用websocet通道发送信息
function sendMessage(msg) {
    msg.roomId = roomId;
    //JSON.stringify()将js对象转换为json对象
    chatSocket.send(JSON.stringify(msg));
}

/*
webrtc及其相关函数
*/
//获取本地视频流并发送join请求
async function getUserMedia() {
    console.log("尝试获取用户摄像头权限");
    try {
        localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        localVideo.srcObject = localStream;
        sendMessage({
            userName: userName,
            type: 'join'
        });
    } catch (error) {
        console.log('获取本地摄像头失败：'+error);
    }
}
// 创建 RTCPeerConnection
function getPeerConnection(v) {
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
/*
其他工具类
*/
//获取url上的变量
function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
}