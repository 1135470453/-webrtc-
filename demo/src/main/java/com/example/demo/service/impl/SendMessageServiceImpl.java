package com.example.demo.service.impl;

import com.example.demo.service.SendMessageService;
import com.example.demo.tool.MeetingWebSocket;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SendMessageServiceImpl implements SendMessageService {

    @Autowired
    private MeetingWebSocket meetingWebSocket;


    @Override
    public void send(String message) {
    }
}
