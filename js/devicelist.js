/**************************BLE 4.0操作思路***********************/
/*1：扫描发现设备UUID   2：查看设备连接状态  3：发现服务UUID  4：发现特征值UUID  5：读写特征值
/*2：蓝牙从发现到操作的步骤可能比较容易，比较困难的是纠错，代码必须够强壮，否则很容易死机
/**************************BLE 4.0操作思路***********************/
var g_bleSDK = null;
var remsg = null;

const _PERIPHERALUUID = "peripheralUUID";
const _SERVICEUUID = "serviceUUID";
//可读可写
const _READUUID = "readUUID";
const _WRITEUUID = "writeUUID";

//下拉刷新配置
var refresh = {
	visible: true,
	loadingImg: 'widget://icon/wifi.svg',
	bgColor: '#efeff4',
	textColor: '#333333',
	textDown: '下拉刷新...',
	textUp: '松开刷新...',
	showTime: true
};

var test_timer_id = null;

//打开登录页面
function open_loginPage() {
	openWin("login", "widget://html/login.html", true, null);
}

//toast消息提醒
function msg(content) {
	api.toast({
		msg: content,
		duration: 2000,
		location: 'bottom'
	});
}

//设置手机状态栏字体颜色//light:白色；dark:黑色 style: style
function setStatusBar(style) {
	api.setStatusBarStyle({
		style: style
	});
}

//打开新页面/窗口
function openWin(name, url, isReload, args) {
	api.openWin({
		name: name, //要打开的新页面去掉后面的.html
		url: url, //子页面路径
		reload: isReload, //打开新页面是否重新加载/刷新页面
		slidBackEnabled: false, //只对IOS有效//禁止滑动关闭
		delay: 0,
		bounces: false,
		vScrollBarEnabled: false,
		hScrollBarEnabled: false,
		bgColor: 'white',
		pageParam: args
	});
}

//关闭页面/窗口
function closeWin(name) {
	api.closeWin({
		name: name
	});
}

function closeFuondDevice() {
	closeWin('foundDevice');
}

//关闭APP
function closeWidget() {
	api.closeWidget({
		id: _ID,
		silent: true
	});
}

//监听安卓手机返回键
function Android_ListenKeyBack() {
	api.addEventListener({
		name: 'keyback'
	}, function(ret, err) {
		var url = location.href;
		var name = url.substr(url.length - 10, url.length);
		if(name == "login.html" || name == "index.html") {
			msg("再按一次退出应用");
			api.addEventListener({
				name: 'keyback'
			}, function(ret, err) {
				closeWidget();
			});
		}
	});
	setTimeout(function() {
		Android_ListenKeyBack();
	}, 3000);
}

function timerLoop() {
	fngetPeripheral();
	test_timer_id = setTimeout('timerLoop()', 5000);
}

function fnsearchDevice() {
	//可以根据UUID来扫，这里是笼统扫描，常用此方式
	g_bleSDK.scan({
		serviceUUIDs: localStorage.getItem(_SERVICEUUID)
	}, function(ret) {
		if(ret.status) {
			timerLoop();
		}
	});
}

function fnInitBLEManager() {
	g_bleSDK.initManager(function(ret) {
		if(ret.state == "poweredOn") {
			//alert('init success');
			fnsearchDevice();
		}
	});
}

function fngetPeripheral() {
	g_bleSDK.getPeripheral(function(ret) {
		if(ret && typeof(ret.peripherals) === "object") {
			fninnersearchDeviceHtml2List(ret.peripherals);
		} else {
			fninnersearchDeviceHtml2List(null);
		}
	});
}

function fninnersearchDeviceHtml2List(arr) {
	if(arr == null) {
		document.getElementById("m_mdnslist").innerHTML = "";
		return;
	}

	var html = ""; //需要追加页面
	for(var i in arr) {
		var dict = arr[i]; //开始取得第一个字典类型
		//小心书写，注意大小写
		var Name = dict.name;
		var uuid = dict.uuid;
		var rssi = dict.rssi;
		//处理位置信息
		if(!Name) Name = '未知';
		if(!rssi) rssi = '未知';
		//打包传参,传了uuid参数
		var pack_id = dict.uuid;
		//复杂的拼接过程
		html += '<li class="mui-table-view-cell" id= "' + pack_id + '" onclick=\"fnConnectDevice(this.id)\">'
		html += '<span class="mui-icon mui-icon-info"></span>'; //row2 
		html += '<div class="infor">'; //row3
		html += '<p id="device-name">设&nbsp;&nbsp;备&nbsp;&nbsp;名：' + Name + ' </p>' //row4
		html += '<p id="rssi">信号强度：' + rssi + '</p>'; //row5
		html += '</div></li>'; //row6
	}
	document.getElementById("m_mdnslist").innerHTML = html;
	//g_bleSDK.stopScan();//获得外围设备后停止扫描
}

//这个函数用来检查蓝牙是否连接
function fnCheckisConnect(uuid) {
	g_bleSDK.isConnected({
		peripheralUUID: uuid
	}, function(ret) {
		if(ret) {
			alert("ret=" + JSON.stringify(ret));
		}
	});
}

function EnterTaTaMiOpUI(uuid) {
	document.getElementById('list').style.display = 'none';
	document.getElementById('control').style.display = 'block';
}

function fnConnectDevice(pass_uuid) {
	localStorage.setItem(_PERIPHERALUUID, pass_uuid);
	g_bleSDK.connect({
		peripheralUUID: pass_uuid
	}, function(ret, err) {
		if(ret.status) {
			msg("连接成功！");
			//注意要把所有的定时器，蓝牙扫描等事件清理掉
			clearTimeout(test_timer_id);
			localStorage.setItem(_PERIPHERALUUID, pass_uuid);
			fndiscoverService();
		} else {
			//alert(err.code);
			//msg("连接失败！");
		}
	});
}

function fnretrievePeripheral(pass_uuid) {
	var uuid = new Array();
	uuid[0] = pass_uuid;
	g_bleSDK.retrievePeripheral({
		peripheralUUIDs: uuid
	}, function(ret) {
		if(ret) {
			alert(JSON.stringify(ret));
		}
	});
}

function fndiscoverService() {
	var uuid = localStorage.getItem(_PERIPHERALUUID);
	g_bleSDK.discoverService({
		peripheralUUID: uuid
	}, function(ret, err) {
		if(ret.status) {
			//alert(ret.services);
			localStorage.setItem(_SERVICEUUID, ret.services);
			fndiscoverCharacteristics(ret.services);
		} else {
			//alert(err.code);
		}
	});
}

function fndiscoverCharacteristics(pass_service_uuid) {
	g_bleSDK.discoverCharacteristics({
		serviceUUID: localStorage.getItem(_SERVICEUUID),
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID)

	}, function(ret, err) {
		if(ret.status) {
			var read_uuid = ret.characteristics[0].uuid;
			var write_uuid = ret.characteristics[1].uuid;
			//alert("read uuid=" + read_uuid + "->write uuid=" + write_uuid);
			localStorage.setItem(_READUUID, read_uuid);
			localStorage.setItem(_WRITEUUID, write_uuid);
			clearTimeout(test_timer_id);
			test_timer_id = null;
			fnsetSimpleNotify();
		} else {
			alert(err.code);
		}
	});
}

function fnsetSimpleNotify() {
	g_bleSDK.setSimpleNotify({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
		serviceUUID: localStorage.getItem(_SERVICEUUID),
		characteristicUUID: localStorage.getItem(_READUUID)
	}, function(ret, err) {
		if(ret.status) {
			fnbinding();
		}else{
			alert(err.code);
		}
	});
}

//获取接收到的数据
function fngetAllSimpleNotifyData() {
	g_bleSDK.getAllSimpleNotifyData(function(ret) {
		var uuid = localStorage.getItem(_PERIPHERALUUID);
		for(var key in ret) {
			if(key == uuid) {
				remsg = ret[key].data;
				alert(remsg);
				fnclearAllSimpleNotifyData();
			}
		}
	});
}

//清空数据接收区缓存
function fnclearAllSimpleNotifyData() {
	g_bleSDK.clearAllSimpleNotifyData();
}

//设备绑定
function fnbinding() {
	var sval = localStorage.getItem('time_stamp') + _AskBind;
	//sval = sval.replace(/(.{2})/g, "$1 ");
	g_bleSDK.writeValueForCharacteristic({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
		serviceUUID: localStorage.getItem(_SERVICEUUID),
		characteristicUUID: localStorage.getItem(_WRITEUUID),
		value: sval
	});
	setTimeout(function(){
		fngetAllSimpleNotifyData();
	})
}

function fntatami_goup() {
	g_bleSDK.writeValueForCharacteristic({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
		serviceUUID: localStorage.getItem(_SERVICEUUID),
		characteristicUUID: localStorage.getItem(_WRITEUUID),
		value: _Up
	}, function(ret, err) {
		if(ret.status) {
			//alert("go up" + JSON.stringify(ret));
		} else {
			alert(err.code);
		}
	});
}

function fntatami_stop() {
	g_bleSDK.writeValueForCharacteristic({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
		serviceUUID: localStorage.getItem(_SERVICEUUID),
		characteristicUUID: localStorage.getItem(_WRITEUUID),
		value: _Stop
	}, function(ret) {
		if(ret) {
			//alert("go up" + JSON.stringify(ret));
		}
	});
}

function fntatami_godown() {
	g_bleSDK.writeValueForCharacteristic({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
		serviceUUID: localStorage.getItem(_SERVICEUUID),
		characteristicUUID: localStorage.getItem(_WRITEUUID),
		value: _Down
	}, function(ret) {
		if(ret) {
			//alert("go up" + JSON.stringify(ret));
		}
	});
}