const fs = require('fs');
const path = require('path');
const https = require('https');

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

const files = [
  // 1. SSD MobileNet V1
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',

  // 2. Face Landmark 68
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',

  // 3. Face Recognition
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

const targetDir = path.join(__dirname, 'models');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);

function downloadFile(file) {
  return new Promise((resolve, reject) => {
    const dest = path.join(targetDir, file);
    const fileStream = fs.createWriteStream(dest);

    https.get(baseUrl + file, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return https.get(res.headers.location, (redirectRes) => {
          redirectRes.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            console.log(` تم تنزيل: ${file}`);
            resolve();
          });
        });
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${file}: Status ${res.statusCode}`));
      }

      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(` تم تنزيل: ${file}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log('جاري تحميل الموديلات من المستودع الرسمي...');
  for (const file of files) {
    await downloadFile(file);
  }
  console.log(' اكتمل تحميل جميع ملفات الموديل بنجاح!');
}

run().catch(console.error);