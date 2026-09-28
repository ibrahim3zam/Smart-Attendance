const path = require('path');
const fs = require('fs');
const jpeg = require('jpeg-js');

const faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js');

const MODELS_PATH = path.join(__dirname, 'models');

async function loadModels() {
  console.log('جاري تهيئة محرك الذكاء الاصطناعي (WASM)...');
  await faceapi.tf.setBackend('wasm');
  await faceapi.tf.ready();

  console.log('جاري تحميل النماذج من القرص...');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_PATH);
  console.log('تم تحميل جميع نماذج الوجه بنجاح!');
}

function imageToTensor(imagePath) {
  const buffer = fs.readFileSync(imagePath);
  const rawImageData = jpeg.decode(buffer, { useTArray: true }); 

  const numChannels = 3;
  const numPixels = rawImageData.width * rawImageData.height;
  const values = new Uint8Array(numPixels * numChannels);

  for (let i = 0; i < numPixels; i++) {
    values[i * 3] = rawImageData.data[i * 4];         
    values[i * 3 + 1] = rawImageData.data[i * 4 + 1]; 
    values[i * 3 + 2] = rawImageData.data[i * 4 + 2]; 
  }

  return faceapi.tf.tensor3d(values, [rawImageData.height, rawImageData.width, numChannels], 'int32');
}

async function getFaceDescriptor(imagePath) {
  const tensor = imageToTensor(imagePath);

  const detection = await faceapi
    .detectSingleFace(tensor)
    .withFaceLandmarks()
    .withFaceDescriptor();

  tensor.dispose();

  if (!detection) {
    throw new Error('لم يتم العثور على أي وجه في الصورة، تأكد من وضوح الصورة ومواجهة الوجه للكاميرا');
  }

  return Array.from(detection.descriptor);
}

function compareFaces(descriptor1, descriptor2, threshold = 0.6) {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  const isMatch = distance < threshold;
  return { isMatch, distance };
}

module.exports = {
  loadModels,
  getFaceDescriptor,
  compareFaces,
};