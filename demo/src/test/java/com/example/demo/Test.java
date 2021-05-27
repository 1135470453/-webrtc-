package com.example.demo;


public class Test {
    public String decodeString(String s) {
        String end = "";
        String n = "";
        String num = "";
        //指示当前end存到哪一位
        int point = -1;
        for(int i = 0;i<s.length();i++){
            if(s.charAt(i) == ']'){
                while(end.charAt(point) != '['){
                    n = end.substring(point,point+1) + n;
                    end = end.substring(0,point);
                    point--;
                    System.out.println(end);
                    System.out.println(point);
                }
                end = end.substring(0,point);
                point--;
                System.out.println(end);
                System.out.println(point);
                while(point >=0 &&Character.isDigit(end.charAt(point))){
                    num = end.substring(point,point+1) + num;
                    end = end.substring(0,point);
                    point--;
                }
                for(int j=0;j<Integer.parseInt(num);j++){
                    end += n;
                    point += n.length();
                }

            }else{
                end += s.substring(i,i+1);
                point++;
                System.out.println(end);
                System.out.println(point);
            }
        }
        return end;
    }
    public static void main(String[] args) {
        Test test = new Test();
        System.out.println(test.decodeString("3[a]2[bc]"));
    }
}
