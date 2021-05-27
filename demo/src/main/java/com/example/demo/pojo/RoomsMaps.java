package com.example.demo.pojo;

import com.example.demo.tool.MeetingWebSocket;
import org.springframework.stereotype.Component;

import java.util.*;

@Component("roomsMaps")
public class RoomsMaps {
    /*
    *   结构:
    * (map){
    *   roomId :(map)roomMap{
    *       IdList:(list){(String)name},
    *       WsList:(list){
    *                       (map)wsMap{
    *                               (MeetingWebSocket) MeetingWebSocket,
    *                               (String)roomid,
    *                               (String)userId,
    *                               (String)userName
    *                             }
    *                       }
    *   }
    * }
    * */
    private Map<String,Map<String, List>> roomsMap = new HashMap<>();

    public List<String> getIdListByRoomId(String roomId){
        return roomsMap.get(roomId).get("idList");
    }

    /*根据房间号获取房间用户所有信息*/
    public List getWsListByRoomId(String roomId){
        return roomsMap.get(roomId).get("wsList");
    }

    /*向roomId的房间中加入userId的用户*/
    public String insertUser(String roomId, String userName, MeetingWebSocket meetingWebSocket){
        String userId = getUserId();
        if (hasRoomId(roomId)){
            while (hasUserIdOfRoomId(roomId,userId)){
                userId = getUserId();
            }
            roomsMap.get(roomId).get("idList").add(userId);
            Map<String,Object> wsMap = new HashMap<>();
            wsMap.put("MeetingWebSocket",meetingWebSocket);
            wsMap.put("roomId",roomId);
            wsMap.put("userId",userId);
            wsMap.put("userName",userName);
            roomsMap.get(roomId).get("wsList").add(wsMap);
            return userId;
        }else {
            Map<String,List> roomMap = new HashMap<>();
            Map<String,Object> wsMap = new HashMap<>();
            List<String> idList = new ArrayList<>();
            List<Map> wsList = new ArrayList<>();
            wsMap.put("MeetingWebSocket",meetingWebSocket);
            wsMap.put("roomId",roomId);
            wsMap.put("userId",userId);
            wsMap.put("userName",userName);
            wsList.add(wsMap);
            idList.add(userId);
            roomMap.put("idList",idList);
            roomMap.put("wsList",wsList);
            roomsMap.put(roomId,roomMap);
            return userId;
        }
    }


    /*判断该roomId的房间(该房间已经存在)中是否有该userId的用户*/
    public Boolean hasUserIdOfRoomId(String roomId,String userId){
        return roomsMap.get(roomId).get("idList").contains(userId);
    }

    /*判断是否有该房间号的房间*/
    public Boolean hasRoomId(String roomId){
        return roomsMap.containsKey(roomId);
    }

    /*获得一个六位的随机userId*/
    public String getUserId(){
        String userId = "";
        Random random = new Random();
        for (int i = 0;i<6;i++){
            userId += random.nextInt(10);
        }
        return userId;
    }
}
