// 生成VAPID密钥的脚本
// 运行方式: node generate-vapid-keys.js

const webpush = require('web-push');

// 生成VAPID密钥对
const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys生成成功！请将这些密钥添加到你的环境变量中：');
console.log('\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('\n将公钥添加到前端环境变量，私钥保存在服务器端环境变量中。');