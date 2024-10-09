const envConfig = require('../../env.js');
const wifiInfo = require('./home-guestwifi.js');

Page({
    onShareAppMessage() {
        return null; // 禁用分享
    },
    data: {
        targetSSID: '',
        wifiPassword: '',
        message: '',
        messageType: '',
        messageIdentifier: '',
        isConnected: false, // 是否已经连接到指定Wi-Fi
    },

    onLoad: function (options) {
        const { password } = options;
        if (password !== '6666') {
            this.showMessage('您没有权限访问此页面，请扫描正确的二维码。', 'error', 'NO_PERMISSION');

            return;
        }

        // 显示加载中状态
        this.showMessage('初始化...', 'loading', 'INITIALIZING');

        this.loadWifiInfo();
    },

    loadWifiInfo: function () {
        const envVersion = envConfig.envVersion || 'prod';
        console.log("环境变量:", envVersion);

        if (envVersion === 'prod') {
            this.loadWifiInfoFromAPI();
        } else {
            this.loadWifiInfoFromFile();
        }
        console.log('加载的 Wi-Fi 信息为:', this.data.targetSSID, this.data.wifiPassword);
    },

    loadWifiInfoFromAPI: function () {
        this.showMessage('请求 Wi-Fi 信息中...', 'loading', 'LOADING_WIFI_INFO_API'); // 显示加载状态
        wx.request({
            url: 'https://aimy-life.oss-cn-hangzhou.aliyuncs.com/home-guestwifi.json',
            method: 'GET',
            success: (res) => {
                console.log("res.data",res)
                if (res.statusCode === 200 && res.data) {
                    this.setData({
                        targetSSID: res.data.SSID,
                        wifiPassword: res.data.PWD
                    });
                    this.requestLocationPermissionAndInitWifi();
                } else {
                    this.showMessage('获取 Wi-Fi 信息失败', 'error', 'WIFI_INFO_FAILED');
                }
            },
            fail: (err) => {
                console.error('请求 Wi-Fi 信息失败', err);
                this.showMessage('请求 Wi-Fi 信息失败\n'+ JSON.stringify(err), 'error', 'WIFI_INFO_REQUEST_FAILED');
            }
        });
    },

    loadWifiInfoFromFile: function () {
        this.setData({
            targetSSID: wifiInfo.SSID,
            wifiPassword: wifiInfo.PWD
        });
        this.requestLocationPermissionAndInitWifi();
    },

    checkCurrentConnection: function () {
        this.showMessage('正在检查 Wi-Fi 连接状态...', 'loading', 'CHECKING_CONNECTION'); // 显示加载状态
        wx.getConnectedWifi({
            success: (res) => {
                const currentSSID = res.wifi.SSID;
                if (currentSSID === this.data.targetSSID) {
                    // 已连接到目标 Wi-Fi，直接显示已连接状态
                    this.setData({
                        isConnected: true,
                    });
                    this.showMessage(`已连接到 ${currentSSID}`, 'success', 'WIFI_CONNECTED');
                } else {
                    // 未连接到目标 Wi-Fi，继续扫描 Wi-Fi 列表
                    this.scanWifi();
                }
            },
            fail: (err) => {
                console.error('获取已连接 Wi-Fi 信息失败', err);
                this.showMessage('Wi-Fi 未连接或未开启', 'error', 'WIFI_STATUS_FAILED');
                // 如果获取已连接 Wi-Fi 信息失败，继续扫描 Wi-Fi 列表
                this.scanWifi();
            }
        });
    },

    requestLocationPermissionAndInitWifi: function () {
        wx.getSetting({
            success: (res) => {
                if (!res.authSetting['scope.userLocation']) {
                    this.showMessage('检查位置权限...', 'loading', 'REQUESTING_LOCATION_PERMISSION'); // 显示加载状态
                    wx.authorize({
                        scope: 'scope.userLocation',
                        success: () => {
                            this.initAndCheckWifi();
                        },
                        fail: () => {
                            this.showMessage('请开启位置权限以扫描 Wi-Fi 网络。', 'error', 'NO_LOCATION_PERMISSION');
                        }
                    });
                } else {
                    this.initAndCheckWifi();
                }
            }
        });
    },

    reauthorizeLocation: function () {
        this.showMessage('检查位置权限...', 'loading', 'REQUESTING_LOCATION_PERMISSION'); // 显示加载状态
        wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
                this.initAndCheckWifi(); // 成功后初始化 Wi-Fi
            },
            fail: () => {
                this.showMessage(
                    '权限仍未开启，请手动授权。\n' +
                    '您可以点击\n' +
                    '右上角的三个点\n' +
                    '⬇️\n设置\n' +
                    '⬇️\n位置权限\n' +
                    '⬇️\n使用小程序时允许\n' +
                    '以继续使用此功能。',
                    'error',
                    'REAUTHORIZATION_FAILED'
                );
            }
        });
    },


    initAndCheckWifi: function () {
        this.showMessage('正在初始化 Wi-Fi 模块...', 'loading', 'INITIALIZING_WIFI'); // 显示加载状态
        wx.startWifi({
            success: () => {
                this.checkWifiStatus();
            },
            fail: (err) => {
                console.log('Wi-Fi 模块初始化失败', err);
                this.showMessage('Wi-Fi 初始化失败', 'error', 'WIFI_INIT_FAILED');
            }
        });
    },

    checkWifiStatus: function () {
        this.showMessage('正在检查 Wi-Fi 状态...', 'loading', 'CHECKING_WIFI_STATUS'); // 显示加载状态
        wx.getSystemInfo({
            success: (res) => {
                if (res.wifiEnabled) {
                    // Wi-Fi 开启后，检查当前的 Wi-Fi 连接状态
                    this.checkCurrentConnection();
                } else {
                    this.showMessage('Wi-Fi 未打开，请手动打开 Wi-Fi', 'error', 'WIFI_NOT_ENABLED');
                }
            },
            fail: (err) => {
                console.error('获取系统信息失败', err);
                this.showMessage('无法获取 Wi-Fi 状态', 'error', 'WIFI_STATUS_FAILED');
            }
        });
    },

    scanWifi: function () {
        const targetSSID = this.data.targetSSID;

        wx.onGetWifiList((result) => {
            const wifiList = result.wifiList || [];
            const found = wifiList.some(wifi => wifi.SSID === targetSSID);

            if (found) {
                this.showMessage(`发现 Wi-Fi: ${targetSSID}`, 'success', 'WIFI_FOUND');
            } else {
                this.showMessage('未找到指定 Wi-Fi', 'error', 'WIFI_NOT_FOUND');
            }
        });

        this.showMessage('正在获取 Wi-Fi 列表...', 'loading', 'SCANNING_WIFI'); // 显示加载状态
        wx.getWifiList({
            success: (res) => {
                // 获取 Wi-Fi 列表成功，加载状态已显示
            },
            fail: (err) => {
                console.error('获取 Wi-Fi 列表失败', err);
                this.showMessage('获取 Wi-Fi 列表失败', 'error', 'WIFI_LIST_FAILED');
            }
        });
    },

    rescanWifi: function () {
        this.showMessage('重新检查中...', 'loading', 'RESCAN_WIFI');
        this.scanWifi();
    },

    connectToTargetWifi: function () {
        // 如果已经连接到目标 Wi-Fi，不再重复连接
        if (this.data.isConnected) {
            this.showMessage(`已连接到 ${this.data.targetSSID}`, 'success', 'WIFI_CONNECTED');
            return;
        }

        const ssid = this.data.targetSSID;
        const password = this.data.wifiPassword;

        // 连接中
        this.showMessage('正在连接 Wi-Fi...', 'loading', 'WIFI_CONNECTING');

        wx.connectWifi({
            SSID: ssid,
            password: password,
            success: (res) => {
                this.setData({
                    isConnected: true,
                });
                this.showMessage(`已连接到 ${ssid}`, 'success', 'WIFI_CONNECTED');
            },
            fail: (err) => {
                console.error('连接 Wi-Fi 失败', err);
                this.showMessage('连接 Wi-Fi 失败', 'error', 'WIFI_CONNECT_FAILED');
            }
        });
    },

    showMessage: function (message, type, identifier) {
        // 如果是加载状态，直接更新状态
        if (type === 'loading') {
            this.setData({
                message: message,
                messageType: type,
                messageIdentifier: identifier
            });
            console.log('正在加载:', {
                message: message,
                messageType: type,
                messageIdentifier: identifier
            });
        } else {
            // 延迟切换为 success 或 error 状态
            setTimeout(() => {
                this.setData({
                    message: message,
                    messageType: type,
                    messageIdentifier: identifier,
                });
                console.log('更新页面消息:', {
                    message: message,
                    messageType: type,
                    messageIdentifier: identifier
                });
            }, 2222); // 延迟 2 秒显示 success 或 error 信息
        }
    },

    // 关闭页面
    closePage: function () {
        wx.exitMiniProgram(); // 退出小程序
    }
});
