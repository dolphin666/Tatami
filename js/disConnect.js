//滑动解绑
mui('#m_mdnslist').on('tap', '.mui-btn', function(event) {
	var elem = this;
	var li = elem.parentNode.parentNode;
	var btnArray = ['否', '是'];
	mui.confirm('与该设备解绑？', '解除绑定', btnArray, function(e) {
		if(e.index == 1) {
			fnConnectDevice_break(li.id);
		} else {
			//放弃本次绑定
		}
	})
});

function fnConnectDevice_break(pass_uuid) {
	localStorage.setItem(_PERIPHERALUUID, pass_uuid);
	g_bleSDK.connect({
		peripheralUUID: pass_uuid
	}, function(ret, err) {
		if(ret.status) {
			//msg("连接成功！");
			//注意要把所有的定时器，蓝牙扫描等事件清理掉
			clearTimeout(test_timer_id);
			localStorage.setItem(_PERIPHERALUUID, pass_uuid);
			fndiscoverService_break();
		} else {
			//alert(err.code);
			//msg("连接失败！");
		}
	});
}

function fndiscoverService_break() {
	var uuid = localStorage.getItem(_PERIPHERALUUID);
	g_bleSDK.discoverService({
		peripheralUUID: uuid
	}, function(ret, err) {
		if(ret.status) {
			localStorage.setItem(_SERVICEUUID, ret.services);
			if(api.systemType === 'android') {
				localStorage.setItem(_SERVICEUUID, ret.services[2])
			}
			fndiscoverCharacteristics_break(ret.services[2]);
		} else {
			//alert(err.code);
		}
	});
}

function fndiscoverCharacteristics_break(pass_service_uuid) {
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
			setTimeout(function() {
				fnBreakBind();
				clearTimeout(test_timer_id);
			},200);
		} else {
			alert(err.code);
		}
	});
}

//解绑
function fnBreakBind() {
	var sval = localStorage.getItem('time_stamp') + _BreakBind;
	g_bleSDK.writeValueForCharacteristic({
			peripheralUUID: localStorage.getItem(_PERIPHERALUUID),
			serviceUUID: localStorage.getItem(_SERVICEUUID),
			characteristicUUID: localStorage.getItem(_WRITEUUID),
			value: sval
		},
		function(ret) {
			if(ret) {
				//setTimeout(fnConfirmBreak(), 50);
				var uuid = localStorage.getItem(_PERIPHERALUUID);
				localStorage.removeItem(uuid);
				fnclearAllSimpleNotifyData();
				fnDisConnectDecice();
			}
		})
}

//确认解绑
function fnConfirmBreak() {
	g_bleSDK.getAllSimpleNotifyData(function(ret) {
		var uuid = localStorage.getItem(_PERIPHERALUUID);
		alert(JSON.stringify(ret));
		for(var key in ret) {
			if(key == uuid) {
				var msg = '' + ret[key].data;
				msg = msg.substring(12, 14);
				//alert(msg);
				if(msg == _ReBreakBind) { //成功
					localStorage.removeItem(uuid);
					fnclearAllSimpleNotifyData();
					fnDisConnectDecice();
				} else { //失败
					mui.toast('解绑失败');
				}
			}
		}
	})
}

function fnDisConnectDecice() {
	g_bleSDK.disconnect({
		peripheralUUID: localStorage.getItem(_PERIPHERALUUID)
	}, function(ret, err) {
		if(ret.status) {
			//mui.toast("断开连接！");
			console.log('断开连接..')
			closeFuondDevice();
		}
	});
}