export const CANVAS_W = 900;
export const NODE_W  = 148;
export const NODE_H  = 34;

const NODES_PER_ROW   = 5;
const GAP_X           = 12;
const GAP_Y           = 12;
const LAYER_PAD_TOP   = 46;
const LAYER_PAD_BOTTOM= 14;
export const LEFT_PAD = Math.round((CANVAS_W - (NODES_PER_ROW * (NODE_W + GAP_X) - GAP_X)) / 2);

// Vivid, well-separated palette so each layer reads at a glance.
// Hue progression (top → bottom): blue → violet → cyan → slate → orange → red → green → pink
const C = {
  app:      '#2563EB', // blue-600
  java:     '#7C3AED', // violet-600
  native:   '#0891B2', // cyan-600
  service:  '#334155', // slate-700  (anchor — darker, central service tier)
  hal_if:   '#EA580C', // orange-600
  hal_impl: '#DC2626', // red-600
  kernel:   '#16A34A', // green-600
  hw:       '#DB2777', // pink-600
};

const LAYER_ORDER = ['app','java','native','service','hal_if','hal_impl','kernel','hw'];

const LAYER_DEFS = {
  app:      { name:'Application',                                         color:C.app,      bg:'#EFF6FF' }, // blue-50
  java:     { name:'Java API  •  android.hardware.camera2',               color:C.java,     bg:'#F5F3FF' }, // violet-50
  native:   { name:'NDK  /  Native Client  •  libcamera2ndk + libcamera', color:C.native,   bg:'#ECFEFF' }, // cyan-50
  service:  { name:'CameraService  •  libcameraservice',                  color:C.service,  bg:'#F1F5F9' }, // slate-100
  hal_if:   { name:'HAL AIDL Interface  •  android.hardware.camera',      color:C.hal_if,   bg:'#FFF7ED' }, // orange-50
  hal_impl: { name:'HAL Implementation',                                  color:C.hal_impl, bg:'#FEF2F2' }, // red-50
  kernel:   { name:'Linux Kernel  •  Drivers',                            color:C.kernel,   bg:'#F0FDF4' }, // green-50
  hw:       { name:'Hardware',                                            color:C.hw,       bg:'#FDF2F8' }, // pink-50
};

const NODE_DEFS = [
  // ── Application ──────────────────────────────────────────────────────────
  { id:'cam2_app',      label:'Camera2 App',          layer:'app',
    path:'packages/apps/Camera2',
    files:['CameraActivity.java','CaptureModule.java','CaptureActivity.java','CameraModule.java','FocusOverlayManager.java'],
    description:'Primary AOSP camera application. Implements photo, video, and panorama modes using the android.hardware.camera2 Java API.',
    color:C.app },
  { id:'legacy_app',    label:'LegacyCamera',          layer:'app',
    path:'packages/apps/LegacyCamera',
    files:['Camera.java','VideoCamera.java','PhotoModule.java'],
    description:'Legacy camera application using the deprecated Camera API. Kept for compatibility testing.',
    color:C.app },
  { id:'dev_app',       label:'DevCamera',             layer:'app',
    path:'packages/apps/DevCamera',
    files:['DevCamera.java'],
    description:'Developer-facing camera diagnostics and test application.',
    color:C.app },
  { id:'thirdparty',    label:'3rd-party App',         layer:'app',
    path:'', files:[],
    description:'Any third-party Android application using the android.hardware.camera2 Java API or CameraX Jetpack library.',
    color:C.app },
  { id:'ndk_app',       label:'NDK Camera App',        layer:'app',
    path:'frameworks/av/camera/ndk',
    files:['NdkCameraManager.cpp','NdkCameraDevice.cpp'],
    description:'C/C++ native application using the ACameraManager_* NDK API (libcamera2ndk). Avoids JVM overhead for latency-sensitive use cases.',
    color:C.app },

  // ── Java API ──────────────────────────────────────────────────────────────
  { id:'cam_mgr',       label:'CameraManager',         layer:'java',
    path:'frameworks/base/core/java/android/hardware/camera2',
    files:['CameraManager.java'],
    description:'Top-level system service wrapper. Enumerates available cameras, opens a CameraDevice, registers availability/access-priority callbacks.',
    color:C.java },
  { id:'cam_dev',       label:'CameraDevice',          layer:'java',
    path:'frameworks/base/core/java/android/hardware/camera2',
    files:['CameraDevice.java','impl/CameraDeviceImpl.java'],
    description:'Represents an open connection to a physical camera. Creates CameraCaptureSessions and submits CaptureRequests.',
    color:C.java },
  { id:'cam_dev_impl',  label:'CameraDeviceImpl',      layer:'java',
    path:'frameworks/base/core/java/android/hardware/camera2/impl',
    files:['CameraDeviceImpl.java','CameraDeviceSetupImpl.java'],
    description:'Concrete implementation of CameraDevice. Communicates with CameraDeviceClient in CameraService via Binder IPC.',
    color:C.java },
  { id:'cam_sess',      label:'CameraCaptureSession',  layer:'java',
    path:'frameworks/base/core/java/android/hardware/camera2',
    files:['CameraCaptureSession.java','CameraConstrainedHighSpeedCaptureSession.java'],
    description:'Configured capture session with a set of output Surfaces. Submits single or repeating CaptureRequests to the camera pipeline.',
    color:C.java },
  { id:'cap_req',       label:'CaptureRequest',        layer:'java',
    path:'frameworks/base/core/java/android/hardware/camera2',
    files:['CaptureRequest.java'],
    description:'Immutable package of capture parameters (exposure, ISO, focus, flash, output targets) for a single image capture operation.',
    color:C.java },
  { id:'cap_result',    label:'CaptureResult',         layer:'java',
    path:'frameworks/base/core/java/android/hardware/camera2',
    files:['CaptureResult.java','TotalCaptureResult.java','CaptureFailure.java'],
    description:'Per-frame metadata returned after a capture: actual AE/AF/AWB state, sensor timestamp, lens position, and output buffer timestamps.',
    color:C.java },
  { id:'cam_char',      label:'CameraCharacteristics', layer:'java',
    path:'frameworks/base/core/java/android/hardware/camera2',
    files:['CameraCharacteristics.java','CameraMetadata.java'],
    description:'Static properties of a camera device: sensor physical size, supported formats/sizes, capabilities, AE/AF/AWB modes, and lens info.',
    color:C.java },
  { id:'cam_ext_sess',  label:'CameraExtensionSession',layer:'java',
    path:'frameworks/base/core/java/android/hardware/camera2',
    files:['CameraExtensionSession.java','CameraExtensionCharacteristics.java'],
    description:'Capture session that enables OEM/vendor processing extensions: Night mode, HDR, Bokeh, Face Retouch, Auto White Balance tuning.',
    color:C.java },
  { id:'cam_offline',   label:'CameraOfflineSession',  layer:'java',
    path:'frameworks/base/core/java/android/hardware/camera2',
    files:['CameraOfflineSession.java'],
    description:'Allows in-flight capture requests to complete after the camera device is closed, enabling low-power offline post-processing.',
    color:C.java },

  // ── NDK / Native ──────────────────────────────────────────────────────────
  { id:'ndk_mgr',       label:'NdkCameraManager',  layer:'native',
    path:'frameworks/av/camera/ndk',
    files:['NdkCameraManager.cpp','include/camera/NdkCameraManager.h'],
    description:'NDK entry point (ACameraManager). Enumerates cameras and opens NdkCameraDevice. Wraps the native libcamera Binder proxy.',
    color:C.native },
  { id:'ndk_dev',       label:'NdkCameraDevice',   layer:'native',
    path:'frameworks/av/camera/ndk',
    files:['NdkCameraDevice.cpp','include/camera/NdkCameraDevice.h'],
    description:'NDK camera device (ACameraDevice). Creates NdkCameraCaptureSession and submits ACaptureRequests from C/C++ code.',
    color:C.native },
  { id:'ndk_sess',      label:'NdkCaptureSession', layer:'native',
    path:'frameworks/av/camera/ndk',
    files:['NdkCameraCaptureSession.cpp','include/camera/NdkCameraCaptureSession.h'],
    description:'NDK capture session (ACameraCaptureSession). Submits requests and receives results entirely in native C/C++ code without JVM.',
    color:C.native },
  { id:'cam_cpp',       label:'Camera.cpp',        layer:'native',
    path:'frameworks/av/camera',
    files:['Camera.cpp','CameraBase.cpp','ICameraClient.cpp'],
    description:'Native Binder proxy to CameraService (libcamera). Used internally by NDK and the Java JNI bridge layer.',
    color:C.native },
  { id:'cam_meta_cpp',  label:'CameraMetadata',    layer:'native',
    path:'frameworks/av/camera',
    files:['CameraMetadata.cpp','CameraParameters2.cpp','VendorTagDescriptor.cpp'],
    description:'Native C++ helper for reading and writing HAL-level camera metadata key-value pairs. Serializes metadata between service and HAL.',
    color:C.native },

  // ── CameraService ─────────────────────────────────────────────────────────
  { id:'cam_svc',        label:'CameraService',        layer:'service',
    path:'frameworks/av/services/camera/libcameraservice',
    files:['CameraService.cpp','CameraService.h','CameraServiceWatchdog.cpp'],
    description:'System Binder service running in the cameraserver process. Manages device lifecycle, client arbitration, permission checks, and flashlight control.',
    color:C.service },
  { id:'cam_dev_client', label:'CameraDeviceClient',   layer:'service',
    path:'frameworks/av/services/camera/libcameraservice/api2',
    files:['CameraDeviceClient.cpp','CameraDeviceClient.h','CameraOfflineSessionClient.cpp'],
    description:'Server-side Camera2 API session handler. Translates Java/NDK CaptureRequests into HAL stream configurations and buffer queues.',
    color:C.service },
  { id:'cam3_dev',       label:'Camera3Device',        layer:'service',
    path:'frameworks/av/services/camera/libcameraservice/device3',
    files:['Camera3Device.cpp','Camera3Device.h'],
    description:'HAL3 device abstraction layer. Manages the request/result pipeline, enforces ordering, handles partial results and error recovery.',
    color:C.service },
  { id:'cam3_stream',    label:'Camera3OutputStream',  layer:'service',
    path:'frameworks/av/services/camera/libcameraservice/device3',
    files:['Camera3OutputStream.cpp','Camera3InputStream.cpp','Camera3IOStreamBase.cpp'],
    description:'Represents an output stream (preview Surface, ImageReader, MediaRecorder) backed by an ANativeWindow. Manages gralloc buffer lifecycle.',
    color:C.service },
  { id:'cam3_bufmgr',    label:'Camera3BufferMgr',     layer:'service',
    path:'frameworks/av/services/camera/libcameraservice/device3',
    files:['Camera3BufferManager.cpp','Camera3BufferManager.h'],
    description:'Manages gralloc buffer allocation, import, and recycling for camera output streams. Coordinates buffer sharing across multiple streams.',
    color:C.service },
  { id:'cam_prov_mgr',   label:'CameraProviderMgr',    layer:'service',
    path:'frameworks/av/services/camera/libcameraservice/common',
    files:['CameraProviderManager.cpp','CameraProviderManager.h'],
    description:'Discovers and manages camera HAL providers via ICameraProvider AIDL. Handles HAL process death/restart and multi-provider scenarios.',
    color:C.service },
  { id:'cam_flash',      label:'CameraFlashlight',     layer:'service',
    path:'frameworks/av/services/camera/libcameraservice',
    files:['CameraFlashlight.cpp','CameraFlashlight.h'],
    description:'Independent torch/flashlight control. Allows torch-mode access without opening a full camera session (requires HAL support).',
    color:C.service },
  { id:'virt_cam_svc',   label:'VirtualCameraService', layer:'service',
    path:'frameworks/av/services/camera/virtualcamera',
    files:['VirtualCameraProvider.cc','VirtualCameraDevice.cc','VirtualCameraCaptureResultConsumer.cc'],
    description:'Virtual camera HAL service backed by an ANativeWindow Surface. Enables screen-capture cameras, virtual conferencing devices, and injection testing.',
    color:C.service },
  { id:'cam_ext_proxy',  label:'CameraExtProxy',       layer:'service',
    path:'frameworks/base/packages/services/CameraExtensionsProxy',
    files:['CameraExtensionsService.java'],
    description:'Proxy service that routes CameraExtensionSession requests from the framework to the appropriate OEM vendor extension implementation.',
    color:C.service },

  // ── HAL AIDL Interface ────────────────────────────────────────────────────
  { id:'i_cam_prov',    label:'ICameraProvider',        layer:'hal_if',
    path:'hardware/interfaces/camera/provider/aidl',
    files:['ICameraProvider.aidl','ICameraProviderCallback.aidl','ConcurrentCameraIdCombination.aidl'],
    description:'AIDL interface for a camera HAL provider. Enumerates camera devices, provides ICameraDevice handles, and notifies status changes to the framework.',
    color:C.hal_if },
  { id:'i_cam_dev',     label:'ICameraDevice',          layer:'hal_if',
    path:'hardware/interfaces/camera/device/aidl',
    files:['ICameraDevice.aidl'],
    description:'AIDL interface for a single camera device. Provides static metadata (CameraCharacteristics) and opens an ICameraDeviceSession for streaming.',
    color:C.hal_if },
  { id:'i_cam_sess',    label:'ICameraDeviceSession',   layer:'hal_if',
    path:'hardware/interfaces/camera/device/aidl',
    files:['ICameraDeviceSession.aidl','ICameraInjectionSession.aidl'],
    description:'AIDL interface for an active camera streaming session. Configures output streams, submits capture requests, and manages the HAL buffer queue.',
    color:C.hal_if },
  { id:'i_cam_cb',      label:'ICameraDeviceCallback',  layer:'hal_if',
    path:'hardware/interfaces/camera/device/aidl',
    files:['ICameraDeviceCallback.aidl','ICameraOfflineSession.aidl'],
    description:'HAL-to-framework callback interface: notify shutter, notify error, processCaptureResult. Delivers completed image buffers and metadata back to CameraService.',
    color:C.hal_if },

  // ── HAL Implementation ────────────────────────────────────────────────────
  { id:'gcam_hal',      label:'Google Camera HAL', layer:'hal_impl',
    path:'hardware/google/camera/common/hal/google_camera_hal',
    files:['camera_provider.cc','camera_device.cc','camera_device_session.cc','basic_capture_session.cc','basic_request_processor.cc'],
    description:'Reference Camera HAL3 implementation by Google. Implements ICameraProvider/ICameraDevice/ICameraDeviceSession. Handles request processing, result merging, and stream routing.',
    color:C.hal_impl },
  { id:'usb_hal',       label:'USB Camera HAL',     layer:'hal_impl',
    path:'hardware/libhardware/modules/usbcamera',
    files:['CameraHAL.cpp','UsbCamera.cpp','HotplugThread.cpp','Metadata.cpp'],
    description:'HAL implementation for UVC-compliant USB cameras. Detects hotplug via HotplugThread and reads MJPEG/YUV frames through V4L2 ioctls.',
    color:C.hal_impl },
  { id:'legacy_hal',    label:'Legacy HAL (3.x)',   layer:'hal_impl',
    path:'hardware/libhardware/modules/camera',
    files:['3_0/Camera3.cpp','3_4/Camera3.cpp'],
    description:'Legacy HAL3.0/3.4 skeleton implementation used as a base template for older SoC vendor HAL ports.',
    color:C.hal_impl },
  { id:'virt_hal',      label:'Virtual Camera HAL', layer:'hal_impl',
    path:'frameworks/av/services/camera/virtualcamera',
    files:['VirtualCameraProvider.cc','VirtualCameraDevice.cc'],
    description:'Virtual camera HAL backed by a Surface producer. Injects synthetic frames into the pipeline for testing, screen-sharing, and virtual device scenarios.',
    color:C.hal_impl },
  { id:'oem_hal',       label:'OEM / Vendor HAL',   layer:'hal_impl',
    path:'vendor/', files:['(vendor-specific)'],
    description:'SoC/OEM-specific camera HAL implementing ICameraProvider and ICameraDeviceSession for proprietary sensor and ISP pipelines (Qualcomm, Samsung, MediaTek, etc.).',
    color:C.hal_impl },

  // ── Kernel / Drivers ──────────────────────────────────────────────────────
  { id:'v4l2',          label:'V4L2',              layer:'kernel',
    path:'kernel/drivers/media/v4l2-core',
    files:['v4l2-dev.c','v4l2-ioctl.c','v4l2-device.c','videobuf2-core.c'],
    description:'Video for Linux 2 kernel subsystem. Provides /dev/videoX device nodes and the VIDIOC_* ioctl interface consumed by camera HALs to control sensors and capture frames.',
    color:C.kernel },
  { id:'media_ctl',     label:'Media Controller',  layer:'kernel',
    path:'kernel/drivers/media',
    files:['media-device.c','media-entity.c','media-request.c'],
    description:'Kernel media controller framework. Models the camera pipeline as a graph (sensor → ISP → output). Configures routing between V4L2 subdevices via MEDIA_IOC_SETUP_LINK.',
    color:C.kernel },
  { id:'sensor_drv',    label:'Sensor Driver',     layer:'kernel',
    path:'kernel/drivers/media/i2c',
    files:['(e.g. imx766.c, s5k2l7.c)'],
    description:'Camera image sensor kernel driver. Configures sensor registers over I2C (exposure, gain, framerate, resolution), sets streaming mode, and produces MIPI CSI-2 RAW data.',
    color:C.kernel },
  { id:'isp_drv',       label:'ISP Driver',        layer:'kernel',
    path:'kernel/drivers/media/platform',
    files:['(SoC-specific, e.g. mtk-isp/, qcom-isp/)'],
    description:'Image Signal Processor kernel driver. Programs ISP registers for demosaic, noise reduction, HDR merge, lens shading correction, and 3A statistics (AE/AF/AWB).',
    color:C.kernel },
  { id:'flash_drv',     label:'Flash Driver',      layer:'kernel',
    path:'kernel/drivers/leds',
    files:['leds-aw36515.c','leds-ktd2692.c','leds-s2mu107.c'],
    description:'Flash/torch LED kernel driver. Controls flash intensity and strobe timing via I2C or GPIO. Registers as a V4L2 flash subdevice for synchronized capture.',
    color:C.kernel },
  { id:'lens_drv',      label:'Lens Actuator Drv', layer:'kernel',
    path:'kernel/drivers/media/i2c',
    files:['dw9763.c','ak7375.c','lc898217.c'],
    description:'Voice Coil Motor (VCM) lens actuator kernel driver. Moves the lens to achieve auto-focus by adjusting coil current via I2C. Exposes position via V4L2 controls.',
    color:C.kernel },

  // ── Hardware ──────────────────────────────────────────────────────────────
  { id:'cmos_sensor',   label:'CMOS Image Sensor', layer:'hw',
    path:'', files:[],
    description:'Physical CMOS image sensor (e.g., Sony IMX766, Samsung GN2). Converts photons to analog signal, digitizes to RAW Bayer data, and outputs pixels over MIPI CSI-2 lanes.',
    color:C.hw },
  { id:'isp_chip',      label:'ISP Chip',          layer:'hw',
    path:'', files:[],
    description:'Dedicated or integrated Image Signal Processor. Performs demosaicing, multi-frame NR, HDR, tone mapping, lens shading correction, and outputs YUV/JPEG frames.',
    color:C.hw },
  { id:'lens_vcm',      label:'Lens + VCM',        layer:'hw',
    path:'', files:[],
    description:'Optical lens assembly with Voice Coil Motor actuator. Physically moves lens groups for optical auto-focus (OAF) and Optical Image Stabilization (OIS).',
    color:C.hw },
  { id:'flash_led',     label:'Flash LED',         layer:'hw',
    path:'', files:[],
    description:'High-intensity dual-tone LED flash module. Provides illumination for still photo capture and continuous low-intensity torch for video.',
    color:C.hw },
  { id:'mipi_phy',      label:'MIPI CSI-2 PHY',   layer:'hw',
    path:'', files:[],
    description:'Physical layer interface for the MIPI CSI-2 serial bus. Transports RAW pixel data from the image sensor to the ISP at multi-Gbps bandwidth over differential lanes.',
    color:C.hw },
];

function computeLayout(nodeDefs) {
  const countByLayer = {};
  for (const n of nodeDefs) countByLayer[n.layer] = (countByLayer[n.layer] || 0) + 1;

  let currentY = 0;
  const layerArr = [];
  const layerYMap = {};
  for (const id of LAYER_ORDER) {
    const count = countByLayer[id] || 0;
    const rows = Math.max(1, Math.ceil(count / NODES_PER_ROW));
    const height = LAYER_PAD_TOP + rows * NODE_H + (rows - 1) * GAP_Y + LAYER_PAD_BOTTOM;
    layerYMap[id] = currentY;
    layerArr.push({ id, ...LAYER_DEFS[id], y: currentY, height });
    currentY += height;
  }

  const idxByLayer = {};
  const positionedNodes = nodeDefs.map(n => {
    const idx = idxByLayer[n.layer] || 0;
    idxByLayer[n.layer] = idx + 1;
    const col = idx % NODES_PER_ROW;
    const row = Math.floor(idx / NODES_PER_ROW);
    return {
      ...n,
      x: LEFT_PAD + col * (NODE_W + GAP_X),
      y: layerYMap[n.layer] + LAYER_PAD_TOP + row * (NODE_H + GAP_Y),
    };
  });

  return { layers: layerArr, nodes: positionedNodes, totalH: currentY };
}

const _layout = computeLayout(NODE_DEFS);
export const LAYERS  = _layout.layers;
export const NODES   = _layout.nodes;
export const CANVAS_H = _layout.totalH;

export const EDGES = [
  // ── Main capture flow (important) ────────────────────────────────────────
  { source:'cam2_app',       target:'cam_mgr',        label:'Java API',        important:true  },
  { source:'cam_mgr',        target:'cam_dev',         label:'open()',          important:true  },
  { source:'cam_dev',        target:'cam_sess',        label:'createSession()', important:true  },
  { source:'cam_sess',       target:'cap_req',         label:'capture()',       important:true  },
  { source:'cam_mgr',        target:'cam_svc',         label:'Binder IPC',      important:true  },
  { source:'cam_dev',        target:'cam_dev_client',  label:'Binder IPC',      important:true  },
  { source:'cam_dev_client', target:'cam3_dev',        label:'internal',        important:true  },
  { source:'cam_svc',        target:'cam_prov_mgr',    label:'provider',        important:true  },
  { source:'cam_prov_mgr',   target:'i_cam_prov',      label:'AIDL',            important:true  },
  { source:'cam3_dev',       target:'i_cam_sess',      label:'AIDL',            important:true  },
  { source:'i_cam_prov',     target:'gcam_hal',        label:'impl',            important:true  },
  { source:'i_cam_sess',     target:'gcam_hal',        label:'impl',            important:true  },
  { source:'gcam_hal',       target:'v4l2',            label:'V4L2 ioctl()',    important:true  },
  { source:'v4l2',           target:'sensor_drv',      label:'driver',          important:true  },
  { source:'sensor_drv',     target:'cmos_sensor',     label:'I2C',             important:true  },
  { source:'cmos_sensor',    target:'mipi_phy',        label:'CSI-2 RAW',       important:true  },
  { source:'mipi_phy',       target:'isp_drv',         label:'CSI-2 RX',        important:true  },
  { source:'isp_drv',        target:'isp_chip',        label:'mmio',            important:true  },

  // ── Secondary flows ───────────────────────────────────────────────────────
  { source:'legacy_app',     target:'cam_mgr',         label:'Java API',        important:false },
  { source:'dev_app',        target:'cam_mgr',         label:'Java API',        important:false },
  { source:'thirdparty',     target:'cam_mgr',         label:'Java API',        important:false },
  { source:'ndk_app',        target:'ndk_mgr',         label:'NDK API',         important:false },
  { source:'ndk_mgr',        target:'ndk_dev',         label:'open()',          important:false },
  { source:'ndk_dev',        target:'ndk_sess',        label:'create',          important:false },
  { source:'ndk_mgr',        target:'cam_cpp',         label:'JNI',             important:false },
  { source:'cam_dev',        target:'cam_dev_impl',    label:'impl',            important:false },
  { source:'cam3_dev',       target:'cam3_stream',     label:'stream',          important:false },
  { source:'cam3_dev',       target:'cam3_bufmgr',     label:'buffer',          important:false },
  { source:'cam_svc',        target:'cam_flash',       label:'torch',           important:false },
  { source:'virt_cam_svc',   target:'i_cam_prov',      label:'AIDL',            important:false },
  { source:'cam_ext_proxy',  target:'cam_svc',         label:'proxy',           important:false },
  { source:'i_cam_prov',     target:'usb_hal',         label:'impl',            important:false },
  { source:'i_cam_prov',     target:'legacy_hal',      label:'impl',            important:false },
  { source:'i_cam_prov',     target:'virt_hal',        label:'impl',            important:false },
  { source:'i_cam_prov',     target:'oem_hal',         label:'impl',            important:false },
  { source:'i_cam_sess',     target:'oem_hal',         label:'impl',            important:false },
  { source:'usb_hal',        target:'v4l2',            label:'V4L2 ioctl()',    important:false },
  { source:'legacy_hal',     target:'v4l2',            label:'V4L2 ioctl()',    important:false },
  { source:'v4l2',           target:'isp_drv',         label:'driver',          important:false },
  { source:'media_ctl',      target:'sensor_drv',      label:'subdev',          important:false },
  { source:'media_ctl',      target:'isp_drv',         label:'subdev',          important:false },
  { source:'media_ctl',      target:'flash_drv',       label:'subdev',          important:false },
  { source:'media_ctl',      target:'lens_drv',        label:'subdev',          important:false },
  { source:'flash_drv',      target:'flash_led',       label:'GPIO/I2C',        important:false },
  { source:'lens_drv',       target:'lens_vcm',        label:'I2C',             important:false },
];
