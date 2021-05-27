package com.example.demo.controller;

import com.example.demo.entity.MeetingInfo;
import com.example.demo.service.JoinMeetingService;
import com.example.demo.service.ReserveMeetingService;
import com.example.demo.tool.MeetingWebSocket;
import com.sun.deploy.net.URLEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/meeting")
public class MeetingController {

    @Autowired
    private ReserveMeetingService reserveMeetingService;

    @Autowired
    private JoinMeetingService joinMeetingService;

    @Autowired
    private MeetingWebSocket meetingWebSocket;


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
        Map<String,String> map = joinMeetingService.join(roomId);
        return map;
    }


    @PostMapping("/upload")
    public Map<String,String> upload(MultipartFile file, HttpServletRequest request){
        Map<String,String> map = new HashMap<>();
        Map<String,Object> message = new HashMap<>();
        String roomId = request.getParameter("roomId");
        String userName = request.getParameter("userName");
        String URL = "localhost:8080/uploadFile/";
        if (file.getSize()>0){
            try {
                String path = System.getProperty("user.dir")+"/src/main/resources/uploadFile/";
                String name  = roomId+"_"+userName+"_"+file.getOriginalFilename();
                File file1 = new File(path,name);
                file.transferTo(file1);
                map.put("end","succeed");
                message.put("type","file");
                message.put("fileName",name);
                message.put("userName",userName);
                meetingWebSocket.broadCast(roomId,message);
            }catch (Error | IOException error){
                map.put("end","error");
            }
        }else {
            map.put("end","error");
        }
        return map;
    }

    @RequestMapping("/download")
    public Map<String,String> download(HttpServletRequest request,HttpServletResponse response,String fileName) throws UnsupportedEncodingException {
        Map<String,String> map = new HashMap<>();
        String rootPath = System.getProperty("user.dir")+"\\src\\main\\resources\\uploadFile\\";//这里是我在配置文件里面配置的根路径，各位可以更换成自己的路径之后再使用（例如：D：/test）
        String FullPath = rootPath + fileName;//将文件的统一储存路径和文件名拼接得到文件全路径
        System.out.println("fullPath:"+FullPath);
        File packetFile = new File(FullPath);
        String fn = packetFile.getName(); //下载的文件名
        System.out.println("filename:"+fn);
        File file = new File(FullPath);
        // 如果文件名存在，则进行下载
        if (file.exists()) {
            System.out.println("文件存在");
            // 配置文件下载
            response.setHeader("content-type", "application/octet-stream");
            response.setContentType("application/octet-stream");
            // 下载文件能正常显示中文
            response.setHeader("Content-Disposition", "attachment;filename=" + URLEncoder.encode(fileName, "UTF-8"));
            // 实现文件下载
            byte[] buffer = new byte[1024];
            FileInputStream fis = null;
            BufferedInputStream bis = null;
            try {
                fis = new FileInputStream(file);
                bis = new BufferedInputStream(fis);
                OutputStream os = response.getOutputStream();
                int i = bis.read(buffer);
                while (i != -1) {
                    os.write(buffer, 0, i);
                    i = bis.read(buffer);
                }
                System.out.println("Download the song successfully!");
            } catch (Exception e) {
                System.out.println("Download the song failed!");
            } finally {
                if (bis != null) {
                    try {
                        bis.close();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
                if (fis != null) {
                    try {
                        fis.close();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }
            return null;
        } else {//对应文件不存在
            System.out.println("文件不存在");
            map.put("result","failed");
            return map;
        }

    }


}
