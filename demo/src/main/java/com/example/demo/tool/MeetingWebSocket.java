package com.example.demo.tool;

import com.alibaba.fastjson.JSON;
import com.example.demo.entity.RoomsMaps;
import org.springframework.stereotype.Component;

import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
/*1.尝试连接 2.完成项目*/
/*https://www.jianshu.com/p/d79bf8174196
* https://www.jianshu.com/p/3398d0230e5f
* https://www.jianshu.com/p/ac197bca9aed
* https://www.jianshu.com/p/980f0100edbc*/
@ServerEndpoint(value = "/meetingWebSocket/{userId}")
@Component
public class MeetingWebSocket {
    /*房间信息记录*/
    private RoomsMaps roomsMaps = new RoomsMaps();
    Map<String,Session> userMap = new HashMap<>();
    private static int onlineCount = 0;
    private Session session;
    private String roomId;
    private String userId;

    @OnOpen
    public void onOpen(@PathParam("userId") String userId,Session session)throws IOException{
        this.session = session;
//        this.roomId = roomId;
        this.userId = userId;
        onlineCount++;
        userMap.put(this.userId,this.session);
        System.out.println(this.userId+"加入!");
        System.out.println("现在有"+onlineCount+"个用户");
//        Map<String,Object> messageMap = new HashMap<>();
//        Boolean sended = false;
//        if (this.roomsMaps.insertUser(this.roomId,this.userId,this)){
//            messageMap.put("type","joined");
//            messageMap.put("roomid",this.roomId);
//            messageMap.put("idList",roomsMaps.getIdListByRoomId(this.roomId));
//            messageMap.put("userName",this.userId);
//            broadCast(this.roomId,messageMap);
//        }else {
//            messageMap.put("type","error");
//            messageMap.put("roomid",this.roomId);
//            messageMap.put("msg","errorUserId");
//            sendToOne(this.session,messageMap);
//        }
    }

    @OnClose
    public void onClose(){
        userMap.remove(userId);
        onlineCount--;
        System.out.println(userId+"退出");
        System.out.println("现在有"+onlineCount+"个用户");
    }

    @OnMessage
    public void onMessage(String message,Session session) throws IOException {
        for (Session a : userMap.values()){
            a.getBasicRemote().sendText(message);
        }
    }

    public void sendToOne(Session session,Map messageMap){
        try {
            String message = JSON.toJSONString(messageMap);
            session.getBasicRemote().sendText(message);
        }catch (IOException e){
            System.out.println(e.getMessage());
        }

    }

    public void broadCast(String roomId,Map messageMap){
        try{
            String message = JSON.toJSONString(messageMap);
            List<Map> wsList = roomsMaps.getWsListByRoomId(roomId);
            for (Map map : wsList){
                MeetingWebSocket meetingWebSocket = (MeetingWebSocket) map.get("MeetingWebSocket");
                meetingWebSocket.session.getBasicRemote().sendText(message);
            }
        }catch (IOException e){
            System.out.println(e.getMessage());
        }
    }

}
