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
	var titleID = document.getElementById('title').innerText;
	var confirmBlk = document.getElementById('confirm').style.display;
	if(titleID == '榻榻米控制') {
		fnbackToList();
	} else if(confirmBlk == 'block') {
		g_bleSDK.disconnect({
			peripheralUUID: localStorage.getItem(_PERIPHERALUUID)
		}, function(ret, err) {
			if(ret.status) {
				console.log('断开连接..');
			}
		});
	} else {
		closeWin('foundDevice');
	}
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
		var titleID = document.getElementById('title').innerText;
		if(titleID == '榻榻米控制') {
			fnbackToList();
		} else if(confirmBlk == 'block') {
			g_bleSDK.disconnect({
				peripheralUUID: localStorage.getItem(_PERIPHERALUUID)
			}, function(ret, err) {
				if(ret.status) {
					console.log('断开连接..');
				}
			});
		} else {
			closeWin('foundDevice');
		}
	});
}

function timerLoop() {
	fngetPeripheral();
	console.log('timerLoop');
	test_timer_id = setTimeout('timerLoop()', 1000);
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
			console.log('BLE init success');
		}
		if(ret.state == "poweredOff") {
			if(api.systemType === 'android') {
				//alert('请先开启蓝牙后点击搜索');
				mui.alert('请先开启手机蓝牙', '温馨提示', function() {
					closeWin('foundDevice');
				});
			}
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
		if(Name == 'EMB1066 BLE') Name = '樱井智能榻榻米';
		var uuid = dict.uuid; //安卓的是MAC地址，苹果的是UUID
		var rssi = dict.rssi;
		rssi = Math.abs(rssi);
		//判断是否绑定过
		var bind = '';
		var icon = 'icon-lanya1';
		var bindHTML = '';
		if(localStorage.getItem(uuid)) {
			bind = ' binded';
			icon = ' icon-lanya';
			bindHTML = '<span class="mgr">(已绑定)</span>';
		};
		console.log(rssi);

		//处理信息
		if(!Name) Name = '未知设备';
		if(!rssi) rssi = '未知';
		else if(rssi <= 40) rssi = '很强';
		else if(rssi <= 50) rssi = '强';
		else if(rssi <= 60) rssi = '一般';
		else if(rssi <= 70) rssi = '弱';
		else rssi = '差';

		//打包传参,传了uuid参数
		var pack_id = dict.uuid;

		//复杂的拼接过程
		html += '<li class="mui-table-view-cell' + bind + '" id= "' + pack_id + '" title="' + Name + '" onclick=\"fnConnectDevice(this.id,this.title)\">'; //row1
		//html += '<div class="mui-slider-right mui-disabled"><a class="mui-btn mui-btn-red">解绑</a></div>';
		html += '<div class="mui-slider-handle">'; //row2
		html += '<div class="mui-table-cell mui-col-xs-10">'; //row3
		html += '<div class="infor">'; //row4
		html += '<h4 class="mui-ellipsis"><span class="mui-icon iconfont ' + icon + '"></span>' + Name + '</h4>'; //row5
		html += '<p class="mui-h5 mui-ellipsis"><span class="mui-icon iconfont icon-xinhao"></span>信号强度 : ' + rssi + bindHTML + '</p>'; //row6
		html += '</div></li>'; //row7
	}
	document.getElementById("m_mdnslist").innerHTML = html;
}

//这个函数用来检查蓝牙是否连接
function fnCheckisConnect() {
	g_bleSDK.isConnected({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID)
	}, function(ret) {
		if(ret.status) {
			//alert("ret=" + JSON.stringify(ret));
			console.log('isConnect' + JSON.stringify(ret))
		} else {
			console.log('isConnect' + JSON.stringify(ret))
		}
	});
}

function EnterTaTaMiOpUI(uuid) {
	document.getElementById('confirm').style.display = 'none';
	/*api.showProgress({
		animationType: 'zoom',
		title: '连接成功...',
		text: '正在加载数据'
	});*/
	document.getElementById('list').style.display = 'none';
	document.getElementById('control').style.display = 'block';
	document.getElementById('breakBtn').style.display = 'block';
	document.getElementById('title').innerText = '榻榻米控制';

	var onloadSum = 0;
	var WebImg = new Array();
	for(i = 0; i < 6; i++) {
		WebImg[i] = new Image();
		WebImg[i].src = _URL[i];
		WebImg[i].onload = function() {
			onloadSum++;
		}
	}
	var slider = document.getElementById('slider');
	var oimg = slider.getElementsByTagName('img');

	setTimeout(function() {
		if(onloadSum >= 6) {
			for(i = 0; i < oimg.length; i++) {
				oimg[i].parentNode.replaceChild(WebImg[i], oimg[i]);
			}
			//开启广告循环
			var slider = mui("#slider");
			slider.slider({
				interval: 2000
			})
			clearTimeout(checkOnload);
		}
	}, 500)

	var checkOnload = setTimeout(function() {
		if(onloadSum >= 6) {
			for(i = 0; i < oimg.length; i++) {
				oimg[i].parentNode.replaceChild(WebImg[i], oimg[i]);
			}
		}
		//开启广告循环
		var slider = mui("#slider");
		slider.slider({
			interval: 2000
		})
	}, 1000)
}

function fnbackToList() {
	var btnArray = ['否', '是'];
	mui.confirm('确认与设备断开？', '断开连接', btnArray, function(e) {
		if(e.index == 1) { //确认
			//g_bleSDK.stopScan(); //离开后停止扫描
			g_bleSDK.disconnect({ //离开后断开连接
				peripheralUUID: localStorage.getItem(_PERIPHERALUUID)
			}, function(ret, err) {
				if(ret.status) {
					console.log('断开连接..')
					document.getElementById('list').style.display = 'block';
					document.getElementById('control').style.display = 'none';
					document.getElementById('breakBtn').style.display = 'none';
					document.getElementById('begainSearch').style.display = 'block';
					document.getElementById('stopSearch').style.display = 'none';
					document.getElementById('title').innerText = '发现设备';
					document.getElementById('m_mdnslist').innerHTML = '';
					fnclearAllSimpleNotifyData();
					g_bleSDK.stopScan(); //离开后停止扫描
				}
			});
		} else {
			//取消
		}
	})
}

function fnConnectDevice(pass_uuid, device_name) {
	console.log('connectting uuid:' + pass_uuid);
	console.log('connectting name:' + device_name);
	localStorage.setItem(_PERIPHERALUUID, pass_uuid);
	api.showProgress({
		animationType: 'zoom',
		title: '连接中...',
		text: '正在连接请稍等'
	});

	var timeout = setTimeout(function() {
		api.hideProgress();
		mui.alert('蓝牙不稳定或者设备非法', '连接超时', function() {
			fnDisConnectDecice();
		});
	}, 20000);

	if(device_name != '樱井智能榻榻米') {
		api.hideProgress();
		alert('非法设备');
		return;
	} else {
		console.log('合法设备');
		clearTimeout(test_timer_id);
		document.getElementById('alert').style.display = 'none';
		g_bleSDK.connect({
			peripheralUUID: pass_uuid
		}, function(ret, err) {
			if(ret.status) {
				//注意要把所有的定时器，蓝牙扫描等事件清理掉
				clearTimeout(timeout);
				clearTimeout(test_timer_id);
				console.log('connected...');
				fndiscoverService();
			} else {
				console.log(err.code);
				msg("连接失败！");
				api.hideProgress();
			}
		});
	}
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
			if(api.systemType === 'android') {
				localStorage.setItem(_SERVICEUUID, ret.services[2])
			} else {
				localStorage.setItem(_SERVICEUUID, ret.services);
			}
			console.log('_SERVICEUUID: ' + localStorage.getItem(_SERVICEUUID));
			fndiscoverCharacteristics();
		} else {
			console.log('fndiscoverService:' + err.code);
		}
	});
}

function fndiscoverCharacteristics() {
	g_bleSDK.discoverCharacteristics({
		serviceUUID: localStorage.getItem(_SERVICEUUID),
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID)
	}, function(ret, err) {
		if(ret.status && ret.characteristics[0] && ret.characteristics[1]) {
			var read_uuid = ret.characteristics[0].uuid;
			var write_uuid = ret.characteristics[1].uuid;
			console.log("read uuid=" + read_uuid + "->write uuid=" + write_uuid);
			localStorage.setItem(_READUUID, read_uuid);
			localStorage.setItem(_WRITEUUID, write_uuid);
			test_timer_id = null;
			fnsetSimpleNotify();
			setTimeout(function() {
				fnbinding();
				clearTimeout(test_timer_id);
			}, 600);
		} else {
			alert('连接失败啦！再试一次吧！');
			g_bleSDK.disconnect({
				peripheralUUID: localStorage.getItem(_PERIPHERALUUID)
			}, function(ret, err) {
				if(ret.status) {
					console.log('断开连接..');
					api.hideProgress();
				}
			});
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
				setTimeout(checkLock(remsg), 100)
				console.log('recive data:' + remsg);
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
	console.log('send data:' + sval);
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
		api.hideProgress();
		console.log('getData success');
		g_bleSDK.getAllSimpleNotifyData(function(ret) {
			var uuid = localStorage.getItem(_PERIPHERALUUID);
			for(var key in ret) {
				if(key == uuid) {
					remsg = '' + ret[key].data;
					console.log('recive data:' + remsg);
					checkLock(remsg);
					fnclearAllSimpleNotifyData();
					var fbind = isBinding(remsg);
					console.log('bind=' + fbind);
					switch(fbind) {
						case 1: //绑定列表已满
							//	执行绑定列表已满代码块 
							alert('绑定列表已满');
							fnDisConnectDecice();
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
									}, function(ret, err) {
										if(ret.status) {
											console.log('send data:' + sval);
										}
									});
									//等待用户确认
									waitBind();
								} else {
									//放弃本次绑定
									fnDisConnectDecice();
								}
							})
							break;
						default:
							mui.alert('蓝牙通信错误，请重试', '通信错误', function() {
								fnDisConnectDecice();
							});
							break;
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
	setTimeout(fngetAllSimpleNotifyData(), 100);
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
	setTimeout(fngetAllSimpleNotifyData(), 100);
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
	setTimeout(fngetAllSimpleNotifyData(), 100);
}

function fnClickLock() {
	var lockName = document.getElementById('btn-lock-span').getAttribute('name');
	if(lockName == 'hasLocked') {
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
			console.log('send lock');
			document.getElementById('btn-lock').innerHTML = '<span class="mui-icon iconfont icon-suo"  id="btn-lock-span" name="hasLocked" onclick="fnClickLock()"></span><h6>童锁已锁</h6>';
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
			console.log('send unlock');
			document.getElementById('btn-lock').innerHTML = '<span class="mui-icon iconfont icon-suo1"  id="btn-lock-span" name="unLocked" onclick="fnClickLock()"></span><h6>童锁未锁</h6>';
			fnclearAllSimpleNotifyData();
		}
	});

}

function checkLock(msg) {
	msg = msg.substring(14, 16);
	console.log('checkLock:' + msg);
	if(msg == _LockStatus) {
		hasLock = true;
		document.getElementById('btn-lock').innerHTML = '<span class="mui-icon iconfont icon-suo"  id="btn-lock-span" name="hasLocked" onclick="fnClickLock()"></span><h6>童锁已锁</h6>';
	} else if(msg == _UnLockStatus) {
		hasLock = false;
		document.getElementById('btn-lock').innerHTML = '<span class="mui-icon iconfont icon-suo1"  id="btn-lock-span" name="unLocked" onclick="fnClickLock()"></span><h6>童锁未锁</h6>';
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
	document.getElementById('confirm').style.display = 'block';

	/*api.showProgress({
		animationType: 'zoom',
		title: '等待确认',
		text: '按下遥控器停止键'
	});*/

	fnclearAllSimpleNotifyData();

	var intervar = setInterval(function() {
		console.log('wait confirm');
		g_bleSDK.getAllSimpleNotifyData(function(ret) {
				var uuid = localStorage.getItem(_PERIPHERALUUID);
				for(var key in ret) {
					if(key == uuid) {
						var rmsg = '' + ret[key].data;
						//console.log('recive data:' + rmsg);
						var rmsg_1 = rmsg.substring(12, 14);
						var rmsg_2 = rmsg.substring(29, 31);
						console.log('rmsg_1:' + rmsg_1);
						console.log('rmsg_2:' + rmsg_2);
						if(rmsg_1 == _SuccessBind || rmsg_2 == _SuccessBind) {
							localStorage.setItem(uuid, 'ture');
							//api.hideProgress();
							EnterTaTaMiOpUI();
							clearInterval(intervar);
							clearTimeout(reAsk1);
							clearTimeout(reAsk2);
							clearTimeout(finalAsk);
							fnclearAllSimpleNotifyData();
						}
					}
				}
			})
			//fnclearAllSimpleNotifyData();
	}, 1500)

	var reAsk1 = setTimeout(function() {
		reAskBind();
	}, 4600)
	var reAsk2 = setTimeout(function() {
		reAskBind();
	}, 9100)

	var finalAsk = setTimeout(function() {
		clearInterval(intervar);
		finalAskBind();
	}, 15500)
}

function reAskBind() {
	var sval = localStorage.getItem('time_stamp') + _AskBind;
	console.log('reAskBind send data:' + sval);
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
		g_bleSDK.getAllSimpleNotifyData(function(ret) {
			var uuid = localStorage.getItem(_PERIPHERALUUID);
			for(var key in ret) {
				if(key == uuid) {
					remsg = '' + ret[key].data;
					var rmsg_1 = remsg.substring(12, 14);
					var rmsg_2 = remsg.substring(29, 31);
					console.log('rmsg_1:' + rmsg_1);
					console.log('rmsg_2:' + rmsg_2);
					fnclearAllSimpleNotifyData();
					if(rmsg_1 == _HasBind || rmsg_2 == _HasBind) {
						localStorage.setItem(uuid, 'ture');
						//api.hideProgress();
						EnterTaTaMiOpUI();
					} else {
						/*msg('等待超时');
						api.hideProgress();
						fnDisConnectDecice();*/
					}
				}
			}
		})
	}, 200)
}

function finalAskBind() {
	var sval = localStorage.getItem('time_stamp') + _AskBind;
	console.log('finalAskBind send data:' + sval);
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
		g_bleSDK.getAllSimpleNotifyData(function(ret) {
			var uuid = localStorage.getItem(_PERIPHERALUUID);
			for(var key in ret) {
				if(key == uuid) {
					remsg = '' + ret[key].data;
					var rmsg_1 = remsg.substring(12, 14);
					var rmsg_2 = remsg.substring(29, 31);
					console.log('rmsg_1:' + rmsg_1);
					console.log('rmsg_2:' + rmsg_2);
					fnclearAllSimpleNotifyData();
					if(rmsg_1 == _HasBind || rmsg_2 == _HasBind) {
						localStorage.setItem(uuid, 'ture');
						//api.hideProgress();
						EnterTaTaMiOpUI();
					} else {
						msg('等待超时');
						api.hideProgress();
						fnDisConnectDecice();
					}
				}
			}
		})
	}, 200)
}

//解绑
function fnBreakBind() {
	var btnArray = ['否', '是'];
	mui.confirm('与该设备解绑？', '解除绑定', btnArray, function(e) {
		if(e.index == 1) {
			var sval = localStorage.getItem('time_stamp') + _BreakBind;
			g_bleSDK.writeValueForCharacteristic({
					peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
					serviceUUID: localStorage.getItem(_SERVICEUUID),
					characteristicUUID: localStorage.getItem(_WRITEUUID),
					value: sval
				},
				function(ret) {
					if(ret) {
						console.log('send data:' + sval);
						var uuid = localStorage.getItem(_PERIPHERALUUID);
						localStorage.removeItem(uuid);
						fnclearAllSimpleNotifyData();
						fnDisConnectDecice()
					}
				})
		} else {
			//放弃本次绑定
		}
	})
}

//断开连接
function fnDisConnectDecice() {
	/*api.showProgress({
		animationType: 'zoom',
	});*/
	setTimeout(function() {
		g_bleSDK.disconnect({
			peripheralUUID: localStorage.getItem(_PERIPHERALUUID)
		}, function(ret, err) {
			if(ret.status) {
				console.log('断开连接..');
				//api.hideProgress();
				closeWin('foundDevice');
			}
		});
	}, 1000);
}