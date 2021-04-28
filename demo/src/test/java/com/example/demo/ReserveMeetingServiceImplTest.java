package com.example.demo;

import com.example.demo.entity.MeetingInfo;
import com.example.demo.service.impl.ReserveMeetingServiceImpl;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.Map;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = DemoApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class ReserveMeetingServiceImplTest {

    @Autowired
    ReserveMeetingServiceImpl reserveMeetingService = new ReserveMeetingServiceImpl();

    @Test
    public void getRoomIdTest(){
        System.out.println(reserveMeetingService.getRoomId());
    }

    @Test
    public void checkRoomIdTest(){
        System.out.println(reserveMeetingService.checkRoomId("123489"));
    }


    @Test
    public void reserveTest(){
        MeetingInfo meetingInfo = new MeetingInfo();
        meetingInfo.setRoomId("777777");
        meetingInfo.setMeetingDate("2021-05-28");
        meetingInfo.setStartTime("11:49");
        meetingInfo.setEndTime("14:50");
        Map<String,String> map = reserveMeetingService.reserve(meetingInfo);
        System.out.println(map.get("statu"));
        System.out.println(map.get("data"));
    }
}
