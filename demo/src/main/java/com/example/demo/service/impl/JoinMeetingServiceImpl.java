package com.example.demo.service.impl;

import com.example.demo.entity.MeetingInfo;
import com.example.demo.repository.MeetingInfoRepository;
import com.example.demo.service.JoinMeetingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class JoinMeetingServiceImpl implements JoinMeetingService {

    @Autowired
    private MeetingInfoRepository meetingInfoRepository;

    @Override
    public Map<String, String> join(String roomId) {
        Map<String,String> map = new HashMap<>();
        List<MeetingInfo> meetingInfos = meetingInfoRepository.getByRoomID(roomId);
        if (meetingInfos.size() == 0){
            map.put("statu","error");
            map.put("data","RoomId");
        }else if (!checkTime(meetingInfos.get(0))){
            map.put("statu","error");
            map.put("data","time");
        }else {
            map.put("statu","succeed");
            map.put("data",roomId);
        }
        return map;
    }

    //当前时间在会议时间内, 则返回ture,else false
    public boolean checkTime(MeetingInfo meetingInfo){
        Calendar calendar = Calendar.getInstance();
        Date date = calendar.getTime();
        SimpleDateFormat simpleDateFormat_date = new SimpleDateFormat("yyyy-MM-dd");
        SimpleDateFormat simpleDateFormat_time = new SimpleDateFormat("HH:mm");
        return simpleDateFormat_date.format(date).equals(meetingInfo.getMeetingDate())
                && simpleDateFormat_time.format(date).compareTo(meetingInfo.getStartTime()) >= 0
                && simpleDateFormat_time.format(date).compareTo(meetingInfo.getEndTime()) <= 0;
    }

}
