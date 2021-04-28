package com.example.demo;

import com.example.demo.entity.MeetingInfo;
import com.example.demo.repository.MeetingInfoRepository;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.List;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = DemoApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MeetingInfoRepositoryTest {

	@Autowired
	private MeetingInfoRepository meetingInfoRepository;

	@Test
	void getByRoomIDTest() {
		System.out.println("getByRoomIDTest-----------------------");
		String id = "123457";
		List<MeetingInfo> meetingInfos = meetingInfoRepository.getByRoomID(id);
		if (meetingInfos.size() == 0){
			System.out.println("meetingInfos is null-------------------");
		}else {
			for (MeetingInfo a: meetingInfos){
				System.out.println(a.getMeetingDate());
			}
		}

	}
	@Test
	void insertMeetingInfoTest(){
		MeetingInfo meetingInfo = new MeetingInfo();
		meetingInfo.setRoomId("999999");
		meetingInfo.setMeetingDate("2021-04-28");
		meetingInfo.setStartTime("10:49");
		meetingInfo.setEndTime("11:50");
		meetingInfoRepository.insertMeetingInfo(meetingInfo);
	}

}
