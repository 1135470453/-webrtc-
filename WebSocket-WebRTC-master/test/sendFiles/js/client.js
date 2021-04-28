'use strict'

var localVideo = document.querySelector('video#localvideo');
var remoteVideo = document.querySelector('video#remotevideo');

var btnConn = document.querySelector('button#connserver');
var btnLeave = document.querySelector('button#leave');

// 文件传输
const bitrateDiv = document.querySelector('div#bitrate');
const fileInput = document.querySelector('input#fileInput');

const statusMessage = document.querySelector('span#status');
const downloadAnchor = document.querySelector('a#download');

const sendProgress = document.querySelector('progress#sendProgress');
const receiveProgress = document.querySelector('progress#receiveProgress');

const btnSendFile = document.querySelector('button#sendFile');
const btnAbort = document.querySelector('button#abortButton');


var localStream = null;

var roomid = '111111';
var socket =null;

var state = 'init';

var pc = null;
var dc = null;


// 文件传输

var offerdesc = null;
var state = 'init';

var fileReader = null;

var fileName = "";
var fileSize = 0;
var lastModifyTime = 0;
var fileType = "data";

var receiveBuffer = [];
var receivedSize = 0;



var pcConfig={
    'iceServers':[{
        'urls':'turn:121.41.76.43:3478',
        'credential':'123456',
        'username':'huang'
    }]
}

function sendMessage(roomid,data){
    if(socket){
        socket.emit('message',roomid,data);
    }
}

// 文件传输


function sendData(){

    var offset = 0;
    var chunkSize = 16384;
    var file = fileInput.files[0];
    console.log(`File is ${[file.name, file.size, file.type, file.lastModified].join(' ')}`);


    // Handle 0 size files.
    statusMessage.textContent = '';
    downloadAnchor.textContent = '';
    if (file.size === 0) {
        bitrateDiv.innerHTML = '';
        statusMessage.textContent = 'File is empty, please select a non-empty file';
        return;
    }
    //文件进度展示，让其等于文件大小
    sendProgress.max = file.size;

    fileReader = new FileReader();
    fileReader.onerror = error => console.error('Error reading file:', error);
    fileReader.onabort = event => console.log('File reading aborted:', event);
    fileReader.onload = e => {
        console.log('FileRead.onload ', e);
        dc.send(e.target.result);
        offset += e.target.result.byteLength;
        sendProgress.value = offset;
        if (offset < file.size) {
            readSlice(offset);
        }
    }

    var readSlice = o => {
        console.log('readSlice ', o);
        const slice = file.slice(offset, o + chunkSize);
        fileReader.readAsArrayBuffer(slice);
    };

    readSlice(0);

}
function receivemsg(e){

    console.log(`Received Message ${event.data.byteLength}`);
    receiveBuffer.push(event.data);
    receivedSize += event.data.byteLength;

    receiveProgress.value = receivedSize;
    console.log(`Received Message ${receivedSize}`);
    if (receivedSize === fileSize) {
        var received = new Blob(receiveBuffer);
        receiveBuffer = [];

        downloadAnchor.href = URL.createObjectURL(received);
        downloadAnchor.download = fileName;
        downloadAnchor.textContent =
            `Click to download '${fileName}' (${fileSize} bytes)`;
        downloadAnchor.style.display = 'block';
    }
}

function dataChannelStateChange(){
    if(dc){
        var readyState = dc.readyState;
        console.log('Send channel state is: ' + readyState);
        if (readyState === 'open') {
            fileInput.disabled = false;
        } else {
            fileInput.disabled = true;
        }
    }else{
        fileInput.disabled = true;
    }
}




function getAnswer(desc){
    pc.setLocalDescription(desc);
    sendMessage(roomid,desc);
}

function handleAnswerError(err){
    console.error('Failed to get Answer!',err);
}

function getOffer(desc){
    pc.setLocalDescription(desc);
    sendMessage(roomid,desc)
}
function handleOfferError(err){
    console.error('Failed to get Offer!',err);
}

//接收远端流通道
function call(){
    if(state === 'joined_conn'){
        if(pc){
            var options = {
                offerToReceiveAudio:1,
                offerToReceiveVideo:1
            }
            pc.createOffer(options)
                .then(getOffer)
                .catch(handleOfferError);
        }
    }
}

// 第一步：开始服务
function connSignalServer(){
    //开启本地视频
    start();
    return true;
}

function conn(){
    //1 触发socke连接
    socket = io.connect();

    //2 加入房间后的回调
    socket.on('joined',(roomid,id)=>{

        state = 'joined';

        createPeerConnection();

        btnConn.disabled = true;
        btnLeave.disabled =false;

        console.log("reveive joined message:state=",state);
    });
    socket.on('otherjoin',(roomid,id)=>{

        if (state === 'joined_unbind') {
            createPeerConnection();
        }

        //文件传输
        dc = pc.createDataChannel('chatchannel');
        dc.onmessage = receivemsg;
        dc.onopen = dataChannelStateChange;
        dc.onclose = dataChannelStateChange;


        state = 'joined_conn';

        //媒体协商
        call();
        console.log("reveive otherjoin message:state=",state);
    });
    socket.on('full',(roomid,id)=>{
        console.log('receive full message ', roomid, id);

        closePeerConnection();
        closeLocalMedia();

        state = 'leaved';

        btnConn.disabled = false;
        btnLeave.disabled = true;
        console.log("reveive full message:state=",state);
        alert("the room is full!");
    });

    socket.on('leaved',(roomid,id)=>{

        state = 'leaved';
        socket.disconnect();
        btnConn.disabled = false;
        btnLeave.disabled = true;
        console.log("reveive leaved message:state=",state);
    });

    socket.on('bye',(roomid,id)=>{

        state = 'joined_unbind';
        closePeerConnection();
        console.log("reveive bye message:state=",state);
    });
    socket.on('disconnect', (socket) => {
        console.log('receive disconnect message!', roomid);
        if(!(state === 'leaved')){
            closePeerConnection();
            closeLocalMedia();
        }
        state = 'leaved';

    });
    socket.on('message',(roomid,id,data)=>{

        //媒体协商
        if(data){
            if(data.type === 'offer'){
                pc.setRemoteDescription(new RTCSessionDescription(data));
                pc.createAnswer()
                    .then(getAnswer)
                    .catch(handleAnswerError);
            }else if(data.type === 'answer'){
                console.log("reveive client message=====>",data);
                pc.setRemoteDescription(new RTCSessionDescription(data));
            }else if(data.type === 'candidate'){
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex:data.label,
                    candidate:data.candidate
                });
                pc.addIceCandidate(candidate);

            }else if(data.hasOwnProperty('type') && data.type === 'fileinfo'){
                fileName = data.name;
                fileType = data.filetype;
                fileSize = data.size;
                lastModifyTime = data.lastModify;
                receiveProgress.max = fileSize;
            }else{
                console.error('the message is invalid!',data)
            }
        }

        console.log("reveive client message",roomid,id,data);
    });

    socket.emit('join',roomid);
    return;
}

// 扑捉本地视频
function getMediaStream(stream){

    localStream =stream;
    //2 ===============显示本地视频===============
    localVideo.srcObject = localStream;

    //这个函数的调用时机特别重要 一定要在getMediaStream之后再调用，否则会出现绑定失败的情况
    conn();
}

function handleError(err){
    if(err){
        console.error("getUserMedia  error:",err);
    }
}

// 第二步：采集本地视频
function start(){


    if (!navigator.mediaDevices||
        !navigator.mediaDevices.getUserMedia) {
        console.log("getUserMedia is not supported!")
        return;
    } else {

        //1 ===============配置音视频参数===============
        var constraints={
            video:true,
            audio: false
        }

        navigator.mediaDevices.getUserMedia(constraints)
            .then(getMediaStream)
            .catch(handleError)
    }
}

//关闭流通道
function closeLocalMedia(){
    if (localStream&&localStream.getTracks()) {
        localStream.getTracks().forEach((track)=>{
            track.stop();
        });
    }
    localStream = null;
}


function leave(){
    if(socket){
        socket.emit('leave',roomid);
    }

    //释放资源
    closePeerConnection();
    closeLocalMedia();

    btnConn.disabled = false;
    btnLeave.disabled = true;
}

//创建本地流媒体链接
function createPeerConnection(){
    console.log('create RTCPeerConnection!');
    if(!pc){
        pc = new RTCPeerConnection(pcConfig);
        pc.onicecandidate = (e) =>{
            if(e.candidate){
                sendMessage(roomid,{
                    type:'candidate',
                    label:e.candidate.sdpMLineIndex,
                    id:e.candidate.sdpMid,
                    candidate:e.candidate.candidate
                });
            }
        }

        //文件传输
        pc.ondatachannel = e=> {
            if(!dc){
                dc = e.channel;
                dc.onmessage = receivemsg;
                dc.onopen = dataChannelStateChange;
                dc.onclose = dataChannelStateChange;
            }

        }

        pc.ontrack = (e)=>{
            remoteVideo.srcObject = e.streams[0];
        }
    }
    if(pc === null || pc === undefined){
        console.error('pc is null or undefined!');
        return;
    }

    if(localStream === null || localStream === undefined){
        console.error('localStream is null or undefined!');
        return;
    }

    if(localStream){
        localStream.getTracks().forEach((track)=>{
            pc.addTrack(track,localStream);
        })
    }
}

//关闭本地媒体流链接
function closePeerConnection(){
    console.log('close RTCPeerConnection!');
    if(pc){
        pc.close();
        pc = null;
    }
}


function sendfile(){
    sendData();
    btnSendFile.disabled = true;
}

function abort(){
    if(fileReader && fileReader.readyState === 1){
        console.log('abort read');
        fileReader.abort();
    }

}

function handleFileInputChange() {
    var file = fileInput.files[0];
    if (!file) {
        console.log('No file chosen');
    } else {
        fileName = file.name;
        fileSize = file.size;
        fileType = file.type;
        lastModifyTime = file.lastModified;

        sendMessage(roomid, {
            type: 'fileinfo',
            name: file.name,
            size: file.size,
            filetype: file.type,
            lastmodify: file.lastModified
        });

        btnSendFile.disabled = false;
        sendProgress.value = 0;
        receiveProgress.value = 0;

        receiveBuffer = [];
        receivedSize = 0;
    }
}

btnConn.onclick = connSignalServer;

btnLeave.onclick = leave;

btnSendFile.onclick=sendfile;
btnAbort.onclick=abort;
fileInput.onchange = handleFileInputChange;


