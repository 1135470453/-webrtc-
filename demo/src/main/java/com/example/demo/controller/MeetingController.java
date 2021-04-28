package com.example.demo.controller;

import com.example.demo.entity.MeetingInfo;
import com.example.demo.service.JoinMeetingService;
import com.example.demo.service.ReserveMeetingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/meeting")
public class MeetingController {

    @Autowired
    private ReserveMeetingService reserveMeetingService;

    @Autowired
    private JoinMeetingService joinMeetingService;

    @RequestMapping("/reserveMeeting")
    public Map<String,String> reserveMeeting(HttpServletRequest request, HttpServletResponse response){
        MeetingInfo meetingInfo = new MeetingInfo();
        System.out.println(request.getParameter("meetingData")+request.getParameter("startTime")+request.getParameter("endTime"));
        meetingInfo.setMeetingDate(request.getParameter("meetingData"));
        meetingInfo.setStartTime(request.getParameter("startTime"));
        meetingInfo.setEndTime(request.getParameter("endTime"));
        Map<String,String> map = reserveMeetingService.reserve(meetingInfo);
        return map;
    }

    @RequestMapping("/joinMeeting")
    public Map<String,String> joinMeeting(HttpServletRequest request,HttpServletResponse response){
        String roomId = request.getParameter("roomId");
        String userName = request.getParameter("userName");
        Map<String,String> map = joinMeetingService.join(roomId,userName);
        return map;
    }
}
