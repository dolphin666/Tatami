上升/停止/下降按钮：发送数据
锁定按钮 ：读取收到的数据

串口接收数据格式 ：EF + 字节数 + 31 07 01 00 + 16位的数据
串口发送数据格式 ：0B FF + 字节数 + 00 +  16位的数据

生成 8位16进制 时间戳的函数 get_time_stamp()  在连接成功的时候alert出来
