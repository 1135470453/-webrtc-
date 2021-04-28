package com.example.demo.repository;

import com.example.demo.entity.MeetingInfo;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingInfoRepository {
    public List<MeetingInfo> getByRoomID(String roomId);
    public void insertMeetingInfo(MeetingInfo meetingInfo);
}
