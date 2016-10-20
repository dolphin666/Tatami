const _AskBind = '07' ;//APP向EMB1066发送查询设备是否绑定过指令
const _FullBind = 'f7' ;//EMB1066回应绑定列表已满
const _HasBind = 'e7' ;//EMB1066回应已绑定
const _UnBind = 'd7' ;//EMB1066回应未绑定

const _LetBind = '01' ;//APP向EMB1066发送绑定命令
const _ReciveBind = 'f1' ;//EMB1066回应APP是否收到命令
const _SuccessBind = 'e1' ;//EMB1066回应APP绑定命令

const _Up = '02' ;//APP向EMB1066发送上升命令
const _ReUp = 'f2' ;//EMB1066回复发送上升命令

const _Down = '03';//APP向EMB1066发送下降命令
const _ReDown = 'f3';//EMB1066回复发送下降命令

const _Stop = '04' ;//APP向EMB1066发送停止命令
const _ReStop = 'f4' ;//EMB1066回复发送停止命令

const _BreakBind = '05';//APP向EMB1066发送解绑命令
const _ReBreakBind = 'f5';//EMB1066回应解绑命令

const _SendLock = '0a';//APP向EMB1066发送锁定命令
const _SendUnlock = '0b';//APP向EMB1066发送解锁命令
const _ReLock = 'fa';//EMB1066发送锁定命令状到APP
const _ReUnlock = 'fb';//EMB1066发送解锁命令状到APP

const _UnLockStatus = 'ff'//设备解锁
const _LockStatus =  '01'//设备锁定
