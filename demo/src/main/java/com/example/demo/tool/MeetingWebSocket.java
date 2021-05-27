package com.example.demo.tool;

import com.alibaba.fastjson.JSON;
import com.example.demo.pojo.RoomsMaps;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/*2.完成项目*/
/*https://www.jianshu.com/p/d79bf8174196
* https://www.jianshu.com/p/3398d0230e5f
* https://www.jianshu.com/p/ac197bca9aed
* https://www.jianshu.com/p/980f0100edbc*/
@ServerEndpoint(value = "/meetingWebSocket")
@Component
public class MeetingWebSocket {

    //此处是解决无法注入的关键
    private static ApplicationContext applicationContext;
    //你要注入的service或者dao
    private static RoomsMaps roomsMaps;
    public static void setApplicationContext(ApplicationContext applicationContext) {
        MeetingWebSocket.applicationContext = applicationContext;
        roomsMaps = applicationContext.getBean(RoomsMaps.class);
    }



    private static int onlineCount = 0;
    private Session session;
    private String roomId;
    private String userId;
    private String userName;

    @OnOpen
    public void onOpen(Session session)throws IOException{
        System.out.println(roomsMaps);
        onlineCount++;
        System.out.println("一位用户加入,现在有"+onlineCount+"位用户");
    }

    @OnClose
    public void onClose(){
        onlineCount--;
        System.out.println(userId+"退出");
        System.out.println("现在有"+onlineCount+"个用户");
    }

    @OnMessage
    public void onMessage(String message,Session session) throws IOException {
        System.out.println("roomsmaps:"+roomsMaps);
        System.out.println(message);
        Map<String,String> messageMap = (Map<String,String>)JSON.parse(message);
        this.session = session;
        if (messageMap.get("type").equals("join")){
            this.userName = messageMap.get("userName");
            this.roomId = messageMap.get("roomId");
            this.userId = roomsMaps.insertUser(this.roomId,this.userName,this);
            System.out.println(this.roomId+"房间加入Id为"+this.userId+"的"+this.userName);
            Map<String,String> returnMap1 = new HashMap<>();
            returnMap1.put("type","userId");
            returnMap1.put("userId",this.userId);
            sendToOne(this.session,returnMap1);
            Map<String,Object> returnMap2 = new HashMap<>();
            returnMap2.put("type","joined");
            returnMap2.put("roomId",this.roomId);
            returnMap2.put("userList",roomsMaps.getIdListByRoomId(this.roomId));
            List<String> aaa = roomsMaps.getIdListByRoomId(this.roomId);
            for (String a : aaa){
                System.out.println(a);
            }
            returnMap2.put("userId",this.userId);
            returnMap2.put("userName",userName);
            broadCast(this.roomId,returnMap2);
        }else {
            String roomId = messageMap.get("roomId");
            broadCast(roomId,messageMap);
        }
    }


/*向发信息的人返回信息*/
    public void sendToOne(Session session,Map messageMap){
        try {
            String message = JSON.toJSONString(messageMap);
            System.out.println(message);
            session.getBasicRemote().sendText(message);
        }catch (IOException e){
            System.out.println(e.getMessage());
        }

    }

    public void broadCast(String roomId,Map messageMap){
        try{
            String message = JSON.toJSONString(messageMap);
            System.out.println(message);
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
