package com.example.demo;



import com.alibaba.fastjson.JSON;
import net.minidev.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class test {
    public static void main(String[] args) {
        Map<String,String> map = new HashMap<>();
        map.put("name","tom");
        System.out.println(JSON.toJSONString(map));
    }
}
