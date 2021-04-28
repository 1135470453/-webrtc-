package com.example.demo.service.impl;

import com.example.demo.entity.MeetingInfo;
import com.example.demo.repository.MeetingInfoRepository;
import com.example.demo.service.ReserveMeetingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ReserveMeetingServiceImpl implements ReserveMeetingService {

    @Autowired
    private MeetingInfoRepository meetingInfoRepository;

    @Override
    public Map<String, String> reserve(MeetingInfo meetingInfo) {
        Map<String,String> map = new HashMap<>();
        try{
            String roomId = getRoomId();
            while(checkRoomId(roomId)){
                roomId = getRoomId();
            }
            meetingInfo.setRoomId(roomId);
            meetingInfoRepository.insertMeetingInfo(meetingInfo);
            map.put("statu","succeed");
            map.put("data",roomId);
        }catch (Error e){
            System.out.println("reserve-----------");
            System.out.println(e.getMessage());
            map.put("statu","error");
            map.put("data",e.getMessage());
        }
        return map;
    }

    @Override
    public String getRoomId() {
        String roomId = "";
        Random random = new Random();
        for (int i = 0;i<6;i++){
            roomId += random.nextInt(10);
        }
        return roomId;
    }


    //if roomId has existed, return true. else return false
    @Override
    public Boolean checkRoomId(String roomId) {
        return !(meetingInfoRepository.getByRoomID(roomId).size()==0);
    }


}
