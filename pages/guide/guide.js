Page({
    data: {
        password: '', // 默认没有密码
    },

    onLoad: function (options) {
        // 检查传入的密码参数
        if (options.password) {
            this.setData({
                password: options.password // 设置传入的密码
            });
        }
    },
    goToConnectWifi: function () {
        const password = this.data.password; // 使用输入的密码（可以为空）
        wx.navigateTo({
            url: `/pages/connectWifi/connectWifi?password=${password}` // 传递密码参数
        });
    },
});
