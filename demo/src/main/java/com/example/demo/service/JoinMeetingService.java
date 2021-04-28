package com.example.demo.service;

import com.example.demo.entity.MeetingInfo;

import java.util.Map;

public interface JoinMeetingService {
    public Map<String,String> join(String roomId,String userName);
    public boolean checkTime(MeetingInfo meetingInfo);
}
