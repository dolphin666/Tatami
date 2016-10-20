/**************************BLE 4.0操作思路***********************/
/*1：扫描发现设备UUID   2：查看设备连接状态  3：发现服务UUID  4：发现特征值UUID  5：读写特征值
/*2：蓝牙从发现到操作的步骤可能比较容易，比较困难的是纠错，代码必须够强壮，否则很容易死机
/**************************BLE 4.0操作思路***********************/
var g_bleSDK = null;
var hasLock = null;
var remsg = null;

const _PERIPHERALUUID = "peripheralUUID";
const _SERVICEUUID = "serviceUUID";
//可读可写
const _READUUID = "readUUID";
const _WRITEUUID = "writeUUID";
//设备名称
const _DEVICELIST = "deviceList";

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
	fnDisConnectDecice(); //离开后断开连接
	g_bleSDK.stopScan(); //离开后停止扫描
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
		closeFuondDevice()
	});
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
		document.getElementById("m_mdnslist").innerHTML = "";
		return;
	}
	var html = ""; //需要追加页面
	for(var i in arr) {
		var dict = arr[i]; //开始取得第一个字典类型
		//小心书写，注意大小写
		var Name = dict.name;
		var uuid = dict.uuid; //安卓的是MAC地址，苹果的是UUID
		var rssi = dict.rssi;
		//判断是否绑定过
		var bind = '';
		var bindHTML = '';
		if(localStorage.getItem(uuid)) {
			bind = ' binded';
			bindHTML = '<span class="mgr">(已绑定)</span>';
		};

		//处理位置信息
		if(!Name) Name = '未知';
		if(!rssi) rssi = '未知';
		//打包传参,传了uuid参数
		var pack_id = dict.uuid;
		//复杂的拼接过程
		html += '<li class="mui-table-view-cell' + bind + '" id= "' + pack_id + '" onclick=\"fnConnectDevice(this.id)\">';
		html += '<div class="mui-slider-right mui-disabled"><a class="mui-btn mui-btn-red">解绑</a></div>';
		html += '<div class="mui-slider-handle">';
		html += '<span class="mui-icon mui-icon-info"></span>'; //row2
		html += '<div class="infor">'; //row3
		html += '<p id="device-name">设&nbsp;&nbsp;备&nbsp;&nbsp;名：' + Name + ' </p>' //row4
		html += '<p id="rssi">信号强度：' + rssi + bindHTML + '</p>'; //row5
		html += '</div></li>'; //row6
	}
	document.getElementById("m_mdnslist").innerHTML = html;
}

//这个函数用来检查蓝牙是否连接
function fnCheckisConnect() {
	g_bleSDK.isConnected({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID)
	}, function(ret) {
		if(ret.status) {
			alert("ret=" + JSON.stringify(ret));

		} else {

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
			//alert(JSON.stringify(ret));
		}
	});
}

function fndiscoverService() {
	//alert('fndiscoverService');
	var uuid = localStorage.getItem(_PERIPHERALUUID);
	g_bleSDK.discoverService({
		peripheralUUID: uuid
	}, function(ret, err) {
		if(ret.status) {
			localStorage.setItem(_SERVICEUUID, ret.services);
			if(api.systemType === 'android') {
				localStorage.setItem(_SERVICEUUID, ret.services[2])
			}
			fndiscoverCharacteristics(ret.services);
		} else {
			alert('fndiscoverService' + err.code);
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
			test_timer_id = null;
			fnsetSimpleNotify();
			setTimeout(function(){
				fnbinding();
				clearTimeout(test_timer_id);
			},600);
			//EnterTaTaMiOpUI();
		} else {
			alert('非法设备');
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
			//alert('setSimpleNotify' + ret.status);
		} else {
			//alert('setSimpleNotify' + err.code);
		}
	});
}

//获取接收到的数据
function fngetAllSimpleNotifyData() {
	g_bleSDK.getAllSimpleNotifyData(function(ret) {
		var uuid = localStorage.getItem(_PERIPHERALUUID);
		for(var key in ret) {
			if(key == uuid) {
				remsg = '' + ret[key].data;
				setTimeout(checkLock(remsg), 200)
				//console.log(remsg);
				fnclearAllSimpleNotifyData();
			}
		}
	})
}

//清空数据接收区缓存
function fnclearAllSimpleNotifyData() {
	g_bleSDK.clearAllSimpleNotifyData();
}

//设备绑定
function fnbinding() {
	//alert('binding');
	//询问是否绑定
	var sval = localStorage.getItem('time_stamp') + _AskBind;
	g_bleSDK.writeValueForCharacteristic({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
		serviceUUID: localStorage.getItem(_SERVICEUUID),
		characteristicUUID: localStorage.getItem(_WRITEUUID),
		value: sval
	}, function(ret) {
		if(ret) {
			//alert(JSON.stringify(ret));
		}
	});
	setTimeout(function() {
		//fngetAllSimpleNotifyData();
		console.log('getData');
		g_bleSDK.getAllSimpleNotifyData(function(ret) {
			var uuid = localStorage.getItem(_PERIPHERALUUID);
			for(var key in ret) {
				if(key == uuid) {
					remsg = '' + ret[key].data;
					//alert(remsg);
					checkLock(remsg);
					fnclearAllSimpleNotifyData();
					var fbind = isBinding(remsg);
					switch(fbind) {
						case 1: //绑定列表已满
							//	执行绑定列表已满代码块 
							alert('绑定列表已满');
							break;
						case 2: //已绑定
							//执行已绑定代码块
							localStorage.setItem(uuid, 'ture');
							EnterTaTaMiOpUI();
							break;
						case 3: //未绑定
							//执行未绑定代码块 
							var btnArray = ['否', '是'];
							mui.confirm('开始绑定该设备？', '设备绑定', btnArray, function(e) {
								if(e.index == 1) {
									//发送绑定指令
									var sval = localStorage.getItem('time_stamp') + _LetBind;
									g_bleSDK.writeValueForCharacteristic({
										peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
										serviceUUID: localStorage.getItem(_SERVICEUUID),
										characteristicUUID: localStorage.getItem(_WRITEUUID),
										value: sval
									});
									//等待用户确认
									waitBind();
								} else {
									//放弃本次绑定
									fnDisConnectDecice();
								}
							})
							break;
						default: break;
					}
				}
			}
		})
	}, 800);
}

//上升命令
function fntatami_goup() {
	var sval = localStorage.getItem('time_stamp') + _Up;
	g_bleSDK.writeValueForCharacteristic({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
		serviceUUID: localStorage.getItem(_SERVICEUUID),
		characteristicUUID: localStorage.getItem(_WRITEUUID),
		value: sval
	})
	setTimeout(fngetAllSimpleNotifyData(), 200);
}

//停止命令
function fntatami_stop() {
	var sval = localStorage.getItem('time_stamp') + _Stop;
	g_bleSDK.writeValueForCharacteristic({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
		serviceUUID: localStorage.getItem(_SERVICEUUID),
		characteristicUUID: localStorage.getItem(_WRITEUUID),
		value: sval
	})
	setTimeout(fngetAllSimpleNotifyData(), 200);
}

//下降命令
function fntatami_godown() {
	var sval = localStorage.getItem('time_stamp') + _Down;
	g_bleSDK.writeValueForCharacteristic({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
		serviceUUID: localStorage.getItem(_SERVICEUUID),
		characteristicUUID: localStorage.getItem(_WRITEUUID),
		value: sval
	});
	setTimeout(fngetAllSimpleNotifyData(), 200);
}

function fnClickLock() {
	var dom = document.getElementById('btn-lock');
	var lockName = dom.getElementsByTagName('i')[0].getAttribute('name');
	if(lockName == 'haslocked') {
		fntatami_unlock();
	} else {
		fntatami_lock();
	}
}

function fntatami_lock() {
	var sval = localStorage.getItem('time_stamp') + _SendLock;
	g_bleSDK.writeValueForCharacteristic({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
		serviceUUID: localStorage.getItem(_SERVICEUUID),
		characteristicUUID: localStorage.getItem(_WRITEUUID),
		value: sval
	}, function(ret) {
		if(ret) {
			document.getElementById('btn-lock').innerHTML = '<i class="iconfont" name="haslocked">&#xe603</i> 解锁';
			fnclearAllSimpleNotifyData();
		}
	});
}

function fntatami_unlock() {
	var sval = localStorage.getItem('time_stamp') + _SendUnlock;
	g_bleSDK.writeValueForCharacteristic({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
		serviceUUID: localStorage.getItem(_SERVICEUUID),
		characteristicUUID: localStorage.getItem(_WRITEUUID),
		value: sval
	}, function(ret) {
		if(ret) {
			document.getElementById('btn-lock').innerHTML = '<i class="iconfont name="unlocked"">&#xe602</i> 锁定';
			fnclearAllSimpleNotifyData();
		}
	});

}

function checkLock(msg) {
	msg = msg.substring(14, 16);
	//alert('checkLock:' + msg);
	console.log('checkLock:' + msg);
	if(msg == _LockStatus) {
		hasLock = true;
		document.getElementById('btn-lock').innerHTML = '<i class="iconfont" name="haslocked">&#xe603</i> 解锁';
	} else if(msg == _UnLockStatus) {
		hasLock = false;
		document.getElementById('btn-lock').innerHTML = '<i class="iconfont" name="unlocked">&#xe602</i> 锁定';
	} else return;
}

function isBinding(msg) {
	msg = msg.substring(12, 14);
	if(msg == _FullBind) {
		return 1;
	}
	if(msg == _HasBind) {
		return 2;
	}
	if(msg == _UnBind) {
		return 3;
	}
}

function waitBind() {
	api.showProgress({
		animationType: 'zoom',
		title: '等待确认...',
		text: '请按下确认绑定按钮'
	});
	fnclearAllSimpleNotifyData();
	var intervar = setInterval(function() {
		g_bleSDK.getAllSimpleNotifyData(function(ret) {
			var uuid = localStorage.getItem(_PERIPHERALUUID);
			for(var key in ret) {
				if(key == uuid) {
					var msg = '' + ret[key].data;
					msg = msg.substring(12, 14);
					//alert(msg);
					if(msg == _SuccessBind) {
						localStorage.setItem(uuid, 'ture');
						api.hideProgress();
						EnterTaTaMiOpUI();
						clearInterval(intervar);
						clearTimeout(meterProgress);
					}
				}
			}
		})
		fnclearAllSimpleNotifyData();
	}, 300)

	var meterProgress = setTimeout(function() {
		clearInterval(intervar);
		api.hideProgress();
		msg('等待超时');
		fnDisConnectDecice();
	}, 10000)

}