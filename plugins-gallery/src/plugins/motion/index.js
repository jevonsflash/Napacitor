/**
 * Motion 调试页:传感器支持检测 / 启动 / 停止监听(最新读数显示在输出区)。
 */
var SENSORS = {
  accelerometer: { label: '加速度计', start: 'startAccelerometer', stop: 'stopAccelerometer', check: 'isAccelerometerSupported', event: 'accelerometerReading' },
  gyroscope: { label: '陀螺仪', start: 'startGyroscope', stop: 'stopGyroscope', check: 'isGyroscopeSupported', event: 'gyroscopeReading' },
  magnetometer: { label: '磁力计', start: 'startMagnetometer', stop: 'stopMagnetometer', check: 'isMagnetometerSupported', event: 'magnetometerReading' },
  compass: { label: '指南针', start: 'startCompass', stop: 'stopCompass', check: 'isCompassSupported', event: 'compassReading' },
  barometer: { label: '气压计', start: 'startBarometer', stop: 'stopBarometer', check: 'isBarometerSupported', event: 'barometerReading' },
};

var handle = null; // 当前监听句柄
var active = null; // 当前监听中的传感器 key

function current() {
  return SENSORS[document.getElementById('in-sensor').value];
}

document.getElementById('btn-check').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var result = await napacitor.registerPlugin('Motion')[current().check]();
    alert(JSON.stringify(result, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-start').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var spec = current();
    var motion = napacitor.registerPlugin('Motion');
    if (handle) {
      // 切换传感器:先停掉上一个
      await handle.remove();
      await motion[SENSORS[active].stop]();
    }
    await motion[spec.start]({ speed: document.getElementById('in-speed').value });
    handle = await motion.addListener(spec.event, function (reading) {
      document.getElementById('output').textContent = JSON.stringify(reading);
    });
    active = document.getElementById('in-sensor').value;
    alert('已启动' + spec.label);
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-stop').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    if (!handle) {
      alert('当前没有运行中的监听');
      return;
    }
    await handle.remove();
    handle = null;
    await napacitor.registerPlugin('Motion')[SENSORS[active].stop]();
    var label = SENSORS[active].label;
    active = null;
    alert('已停止' + label);
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
