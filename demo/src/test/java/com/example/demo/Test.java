package com.example.demo;


import java.util.Arrays;

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

    class Solution {
        // 极大值
        // 选择 Integer.MAX_VALUE / 2 的原因是防止整数相加溢出
        static final int INFTY = Integer.MAX_VALUE / 2;

        public int minCost(int[] houses, int[][] cost, int m, int n, int target) {
            // 将颜色调整为从 0 开始编号，没有被涂色标记为 -1
            for (int i = 0; i < m; ++i) {
                --houses[i];
            }

            // dp 所有元素初始化为极大值
            int[][][] dp = new int[m][n][target];
            for (int i = 0; i < m; ++i) {
                for (int j = 0; j < n; ++j) {
                    Arrays.fill(dp[i][j], INFTY);
                }
            }

            for (int i = 0; i < m; ++i) {
                for (int j = 0; j < n; ++j) {
                    if (houses[i] != -1 && houses[i] != j) {
                        continue;
                    }

                    for (int k = 0; k < target; ++k) {
                        for (int j0 = 0; j0 < n; ++j0) {
                            if (j == j0) {
                                if (i == 0) {
                                    if (k == 0) {
                                        dp[i][j][k] = 0;
                                    }
                                } else {
                                    dp[i][j][k] = Math.min(dp[i][j][k], dp[i - 1][j][k]);
                                }
                            } else if (i > 0 && k > 0) {
                                dp[i][j][k] = Math.min(dp[i][j][k], dp[i - 1][j0][k - 1]);
                            }
                        }

                        if (dp[i][j][k] != INFTY && houses[i] == -1) {
                            dp[i][j][k] += cost[i][j];
                        }
                    }
                }
            }

            int ans = INFTY;
            for (int j = 0; j < n; ++j) {
                ans = Math.min(ans, dp[m - 1][j][target - 1]);
            }
            return ans == INFTY ? -1 : ans;
        }
    }
}
