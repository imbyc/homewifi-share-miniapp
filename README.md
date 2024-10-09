# homewifi-share-miniapp
不用再告诉来家客人Wi-Fi是哪一个?密码是多少?的小程序。微信扫码快速连接Wi-Fi

## 修改指引

修改`env.js`中变量为dev时, 从`pages/connectWifi/home-guestwifi.js` 加载wifi信息用于本地开发

发布小程序时可以修改为`prod`, 走接口加载wifi信息,方便后续更改

接口可准备一个静态json文件,放到CDN,如七牛云,阿里云OSS等 通过连接获取

JSON格式如下:

```
{"SSID":"MY-WIFI","PWD":"1234567890"}
```

并替换`api.js`中的接口地址为静态json文件地址

![image](https://github.com/user-attachments/assets/060a1d42-7b0a-45b3-bb1b-8489f170b346)
![2f7050f1fdd50415372db6010350b63](https://github.com/user-attachments/assets/eab06667-0a29-4b0f-84fc-a9d9e66d0433)


