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
// 文本
var textMsg = document.getElementById('textMsg');
// 本地流
var localStream = null;
// 用于存储screenshot流
var screenshootStream = null;
// 存储用户对象
var peerList = {};
//文件
var fileBox;
//屏幕共享参数
var screenConstraints = {
    video: true
};
//开启的video数量
var videoNum = 0;


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
                userJoined(msg.userList, msg.userId,msg.userName);
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
            case "message": //有人发来消息
                var p = document.createElement('p');
                p.innerText = msg.data;
                textBox.append(p);
                break;
            case "file":
                var p = document.createElement('p');
                p.innerText = msg.userName+':';
                textBox.append(p);
                var a = document.createElement('a');
                var fileName = msg.fileName;
                var arr = fileName.split("_");
                a.textContent = arr[arr.length-1];
                a.onclick = function (){
                  downloadFile(fileName);
                };
                textBox.append(a);
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
function userJoined(data, account, username) {
    // 当大于一个与用户时(房间中不只有自己一个用户的时候)
    if (data.length> 1) {
        /*forEach调用数组的每一个元素,把元素传递给回调函数*/
        data.forEach(v => {
            let obj = {};
            let arr = [v, userId];
            /*sort排序,join用—间隔,然后放入一个字符串:为了保证与每一个用户都有连接，但是不会重复连接*/
            obj.account = arr.sort().join('-');
            if (!peerList[obj.account] && v !== userId) {
                getPeerConnection(obj,userName);
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
        navigator.mediaDevices.getUserMedia((mediaConstraints)).then(stream => {
            localStream = stream;
            localVideo.srcObject = stream;
            sendMessage({
                userName: userName,
                type: 'join'
            });
        });
        // localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    } catch (error) {
        console.log('获取本地摄像头失败：'+error);
    }
}
// 创建 RTCPeerConnection
function getPeerConnection(v,userName) {
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
        console.log("ontrack");
        peer.ontrack = (event) => {
            var video_name = document.createElement("div");
            video_name.className = "col_md_4";
            var video_l = document.createElement("div");
            video_l.className = "row";
            var name_l = document.createElement("div");
            name_l.className = "row";
            var name = document.createElement("p");
            name.innerText = userName;
            name_l.append(name);
            let videos = document.querySelector('#v' + v.account);
            if (videos) {
                videos.srcObject = event.streams[0];
            } else {
                let video = document.createElement('video');
                video.controls = true;
                video.autoplay = 'autoplay';
                video.srcObject = event.streams[0];
                video.id = "v"+v.account;
                video.className = 'col-md-4';
                video_l.append(video);
                video_name.append(video_l);
                video_name.append(name_l);
                videoBox.append(video_name);
            }
        }
    } else {
        console.log("onaddstream");
        peer.onaddstream = (event) => {
            let videos = document.querySelector('#v' + v.account);
            if (videos) {
                videos.srcObject = event.stream;
            } else {
                let video = document.createElement('video');
                video.controls = true;
                video.autoplay = 'autoplay';
                video.srcObject = event.stream;
                video.id = "v"+v.account;
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
    peerList[v.account] = peer;
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
* 功能函数
* */

// 点击按钮发送文字消息
function sendTextMsg(){
    if(textMsg.value){
        var message = userName+': '+textMsg.value;
        sendMessage({
            type:"message",
            data:message
        });
        textMsg.value = '';
    }
}
//点击按钮发送文件
function sendFile(){
    fileBox = $('#file')[0].files[0];
    if (fileBox === null){
        alert("请选择需要上传的文件");
        return false;
    }else {
        var formData = new FormData();
        formData.append("file",fileBox);
        formData.append("userName",userName);
        formData.append("roomId",roomId);
        $.ajax({
            type : "post",
            url : "/meeting/upload",
            data : formData,
            processData : false,
            contentType : false,
            success : function(data){
                if (data.end=="error") {
                    alert("文件提交失败!");
                }else{
                    alert("文件上传成功!");
                }}
        });
    }
}
//点击a标签下载文件
function downloadFile(fileName){
    window.open("/meeting/download?fileName="+fileName);
}

//共享屏幕
function shareScreen(){
    localVideo.remove();
    navigator.mediaDevices.getDisplayMedia(screenConstraints).then(stream => {
        console.log("开始获取用户摄像头");
        var screenStream = stream;
        var screenVideo = document.createElement("video");
        screenVideo.className = "col-md-4";
        screenVideo.id = "localVideo";
        screenVideo.autoplay = 'autoplay';
        screenVideo.controls = true;
        screenVideo.srcObject = screenStream;
        videoBox.appendChild(screenVideo);
        localVideo = screenVideo;
        screenshootStream = stream;
        console.log("获取屏幕成功");
    }).then(function (){
            for (let k in peerList) {
                peerList[k].removeStream(localStream)
                peerList[k].addStream(screenshootStream);
                createOffer(k,peerList[k]);
            }
        }
    );

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