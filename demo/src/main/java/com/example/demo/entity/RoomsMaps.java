package com.example.demo.entity;

import com.example.demo.tool.MeetingWebSocket;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RoomsMaps {
    /*
    * (map){
    *   roomId :(map){
    *       IdList:(list){(String)name},
    *       WsList:(list){
    *                       (map){
    *                               (MeetingWebSocket) MeetingWebSocket,
    *                               (String)roomid,
    *                               (String)userId
    *                             }
    *                       }
    *   }
    * }
    * */
    private Map<String,Map<String, List>> roomsMap = new HashMap<>();

    public List getWsListByRoomId(String roomId){
        return roomsMap.get(roomId).get("wsList");
    }

    public List getIdListByRoomId(String roomId){
        return roomsMap.get(roomId).get("idList");
    }

    /*向roomId的房间中加入userId的用户*/
    public Boolean insertUser(String roomId, String userId, MeetingWebSocket meetingWebSocket){
        if (hasRoomId(roomId)){
            if (hasUserIdOfRoomId(roomId,userId)){
                return false;
            }else {
                roomsMap.get(roomId).get("idList").add(userId);
                Map<String,Object> wsMap = new HashMap<>();
                wsMap.put("MeetingWebSocket",meetingWebSocket);
                wsMap.put("roomId",roomId);
                wsMap.put("userId",userId);
                roomsMap.get(roomId).get("wsList").add(wsMap);
                return true;
            }
        }else {
            Map<String,List> roomMap = new HashMap<>();
            Map<String,Object> wsMap = new HashMap<>();
            List<String> idList = new ArrayList<>();
            List<Map> wsList = new ArrayList<>();
            wsMap.put("MeetingWebSocket",meetingWebSocket);
            wsMap.put("roomId",roomId);
            wsMap.put("userId",userId);
            wsList.add(wsMap);
            idList.add(userId);
            roomMap.put("idList",idList);
            roomMap.put("wsList",wsList);
            roomsMap.put(roomId,roomMap);
            return true;
        }
    }


    /*判断该roomId的房间(该房间已经存在)中是否有该userId的用户*/
    public Boolean hasUserIdOfRoomId(String roomId,String userId){
        return roomsMap.get(roomId).get("nameList").contains(userId);
    }

    /*判断是否有该房间号的房间*/
    public Boolean hasRoomId(String roomId){
        return roomsMap.containsKey(roomId);
    }
}
