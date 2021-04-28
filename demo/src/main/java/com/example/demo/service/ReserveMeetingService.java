package com.example.demo.service;

import com.example.demo.entity.MeetingInfo;

import java.util.Map;

public interface ReserveMeetingService {
    public Map<String,String> reserve(MeetingInfo meetingInfo);
    public String getRoomId();
    public Boolean checkRoomId(String roomId);
}
