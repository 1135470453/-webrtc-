package com.example.demo;

import com.example.demo.entity.MeetingInfo;
import com.example.demo.service.JoinMeetingService;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Map;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = DemoApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class JoinMeetingServiceImplTest implements JoinMeetingService{

////    @Autowired
//    private JoinMeetingServiceImpl joinMeetingService ;
//
////    @Autowired
//    private SendMessageServiceImpl sendMessageService;




        @Autowired
    private JoinMeetingService joinMeetingService ;






    @Test
    public void joinTest(){
        Map<String,String> map = joinMeetingService.join("084475");
        System.out.println(map.get("statu"));
        System.out.println(map.get("data"));
    }

    @Test
    public void checkTimeTest(){
        MeetingInfo meetingInfo = new MeetingInfo();
        meetingInfo.setMeetingDate("2021-04-27");
        meetingInfo.setStartTime("10:49");
        meetingInfo.setEndTime("16:59");
        Calendar calendar = Calendar.getInstance();
        Date date = calendar.getTime();
        SimpleDateFormat simpleDateFormat_date = new SimpleDateFormat("yyyy-MM-dd");
        SimpleDateFormat simpleDateFormat_time = new SimpleDateFormat("HH:mm");
        System.out.println(simpleDateFormat_date.format(date));
        System.out.println(simpleDateFormat_time.format(date));
        System.out.println(simpleDateFormat_time.format(date).compareTo(meetingInfo.getStartTime()));
        System.out.println(simpleDateFormat_time.format(date).compareTo(meetingInfo.getEndTime()));
        if (joinMeetingService.checkTime(meetingInfo)){
            System.out.println("在会议时间");
        }else {
            System.out.println("不在会议时间");
        }

    }

    @Override
    public Map<String, String> join(String roomId) {
        return null;
    }

    @Override
    public boolean checkTime(MeetingInfo meetingInfo) {
        return false;
    }
}
