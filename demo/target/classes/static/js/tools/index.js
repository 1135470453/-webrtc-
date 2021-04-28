function reserveRoom(){
    console.log("reserveRoom-----------")
    layer.open({
        title: "预约会议",
        type: 2,
        area: ['600px', '360px'],
        shadeClose: true,
        content: 'reserveMeeting.html',
        btn:['预约'],
        yes: function (index,layero){
            var body = layer.getChildFrame('body',index);
            var meetingDate = body.find('#meetingDate').val();
            var startTime = body.find('#startTime').val();
            var endTime = body.find('#endTime').val();
            var date_now = new Date();
            var year = date_now.getFullYear();
            var month = date_now.getMonth()+1 < 10 ? "0"+(date_now.getMonth()+1) : (date_now.getMonth()+1);
            var day = date_now.getDate() < 10 ? "0"+date_now.getDate() : date_now.getDate();
            var hour = date_now.getHours();
            var minutes = date_now.getMinutes();
            var d = year + "-" + month + "-" + day;
            var time = hour + ":" +minutes;
            console.log(meetingDate,startTime,endTime,d,time);
            if (meetingDate == null || meetingDate === ""){
                body.find('#tips').text("请选择会议日期");
            }else if (startTime == null || startTime === ""){
                body.find('#tips').text("请选择开始时间");
            }else if (endTime == null || endTime === ""){
                body.find('#tips').text("请选择结束时间");
            }else if (endTime < startTime){
                body.find('#tips').text("结束时间不可以早于开始时间");
            }else if (meetingDate < d){
                body.find('#tips').text("会议日期不可以早于今天");
            } else{
                if (meetingDate == d && startTime<time){
                    body.find('#tips').text("会议开始时间不可以早于当前时间");
                }else {
                    body.find('#tips').text("");
                    var formData = new FormData;
                    formData.append("meetingData",meetingDate);
                    formData.append("startTime",startTime);
                    formData.append("endTime",endTime);
                    $.ajax({
                        type: "post",
                        url: "/meeting/reserveMeeting",
                        data: formData,
                        contentType: false,
                        processData: false,
                        success: function (data) {
                            if (data.statu == "succeed"){
                                alert("会议申请成功,房间号为"+data.data);
                                layer.close(index);
                            }else {
                                alert("会议申请失败");
                                console.log(data.data);
                            }
                        },
                        error: function (e) {
                            console.log(e.status);
                            console.log(e.responseText);
                        }
                    });
                }

            }

        }
    });
}
function joinMeeting() {
    console.log("joinMeeting------");
    layer.open({
        title: "加入会议",
        type: 2,
        area: ['600px', '360px'],
        shadeClose: true,
        content: 'joinMeeting.html',
        btn:['加入'],
        yes: function (index,layero){
            var body = layer.getChildFrame('body',index);
            var roomId = body.find('#roomId').val();
            var userName = body.find('#userName').val();
            if (roomId == null || roomId === ""){
                body.find('#tips').text("请输入房间号");
            }else if (userName == null || userName === ""){
                body.find('#tips').text("请输入用户名");
            }else{
                body.find('#tips').text("");
                var formData = new FormData;
                formData.append("roomId",roomId);
                formData.append("userName",userName);
                $.ajax({
                    type: "post",
                    url: "/meeting/joinMeeting",
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function (data) {
                        if (data.statu == "succeed"){
                            alert(data.data);
                            layer.close(index);
                        }else {
                            alert(data.data);
                        }

                    },
                    error: function (e) {
                        console.log(e.status);
                        console.log(e.responseText);
                    }
                });
            }

        }
    });
}
var websocket;
function link() {
    var username = $('#username').val();
    websocket = new WebSocket("ws://127.0.0.1:8080/meetingWebSocket/"+username);
    websocket.onopen = function () {
        console.log("onopen")
    }
    websocket.onmessage = function (event) {
        console.log("onmessage:"+event.data);
    }
    websocket.onclose = function () {
        console.log("onclose");
    }
}
function send() {
    var message = $('#message').val();
    websocket.send(message);
}