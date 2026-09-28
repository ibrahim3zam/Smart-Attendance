const { loadModels, getFaceDescriptor } = require('./faceService');
const path = require('path');

async function test() {
  await loadModels();
  try {
    const descriptor = await getFaceDescriptor(path.join(__dirname, 'test.jpg'));
    console.log('تم استخراج بصمة الوجه بنجاح!');
    console.log('طول مصفوفة البصمة:', descriptor.length); 
    console.log('عينة من الأرقام:', descriptor.slice(0, 5));
  } catch (error) {
    console.error('خطأ:', error.message);
  }
}

test();