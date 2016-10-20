/**************************BLE 4.0操作思路***********************/
/*1：扫描发现设备UUID   2：查看设备连接状态  3：发现服务UUID  4：发现特征值UUID  5：读写特征值
/*2：蓝牙从发现到操作的步骤可能比较容易，比较困难的是纠错，代码必须够强壮，否则很容易死机
/**************************BLE 4.0操作思路***********************/
var g_bleSDK = null;


const _PERIPHERALUUID = "peripheralUUID";

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
		serviceUUIDs: ''
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
		document.getElementById("m_devicelist").innerHTML = "";
		return;
	}

	/*
					<li class="mui-table-view-cell online">
					<a class="mui-navigate-right" href="javascript:;">
						<span class="mui-icon mui-icon-extra mui-icon-extra-gift"></span>
						<span class="status">已连接</span> tatami two
					</a>
				    </li>
	*/

	var html = ""; //需要追加页面
	//{devices：(array)}
	for(var i in arr) {
		var dict = arr[i]; //开始取得第一个字典类型
		//小心书写，注意大小写
		var Name = dict.name;
		var uuid = dict.uuid;
		//打包传参,传了uuid参数
		var pack_id = dict.uuid;
		//复杂的拼接过程
		html += '<li class="mui-table-view-cell online"' + 'id=' + pack_id + ' onclick=\"fnConnectDevice(this.id)\"' + '>'; //row1
		html += '<a class="mui-navigate-right" href="javascript:;">'; //row2 
		html += '<span class="mui-icon mui-icon-extra mui-icon-extra-gift"></span>'; //row3
		html += '<span class="status">未连接</span>' + Name; //row4
		html += '</a>'; //row5
		html += '</li>'; //row6
	}
	document.getElementById("m_devicelist").innerHTML = html;
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
	var json_param = {
		"uuid": uuid
	};
	//alert('点中了:' + pass_id);
	//此时需要页面传递参数
	openWin("TaTaMiOp", "widget://html/TaTaMiOp.html", true, json_param);
}

function fnConnectDevice(pass_uuid) {
	//alert(pass_uuid);
	g_bleSDK.connect({
		peripheralUUID: pass_uuid
	}, function(ret, err) {
		if(ret.status) {
			alert("连接成功！");
			//注意要把所有的定时器，蓝牙扫描等事件清理掉
			//EnterTaTaMiOpUI(pass_uuid);
			localStorage.setItem(_PERIPHERALUUID, pass_uuid);
			fndiscoverService(pass_uuid);
		} else {
			alert(err.code);
		}
	});
}

function fndiscoverService(pass_uuid) {
	g_bleSDK.discoverService({
		peripheralUUID: pass_uuid
	}, function(ret) {
		if(ret) {
			fndiscoverCharacteristics(ret.services[0]);
		}
	});
}

function fndiscoverCharacteristics(pass_service_uuid) {

	g_bleSDK.discoverCharacteristics({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
		serviceUUID:pass_service_uuid
	}, function(ret) {
		if(ret) {
			alert("discoverCharacteristics=" + JSON.stringify(ret));
		}
	});
}

