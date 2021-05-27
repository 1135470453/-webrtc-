package com.example.demo;

import com.example.demo.tool.MeetingWebSocket;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;

import java.util.Arrays;

@SpringBootApplication
@MapperScan(basePackages = "com.example.demo.repository")
@EntityScan(basePackages = "com.example.demo.entity")

public class DemoApplication {

	public static void main(String[] args) {
		ConfigurableApplicationContext run = SpringApplication.run(DemoApplication.class, args);
		//解决WebSocket不能注入的问题
		MeetingWebSocket.setApplicationContext((ApplicationContext)run);
//		String[] beanNames = run.getBeanDefinitionNames();
//		Arrays.sort(beanNames);
//		for (String beanName : beanNames) {
//			System.out.println(beanName);
//		}

	}

}
