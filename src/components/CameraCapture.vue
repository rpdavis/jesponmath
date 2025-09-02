<template>
  <div class="camera-capture">
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>📷 Take Photo</h3>
          <button @click="$emit('close')" class="close-btn">×</button>
        </div>
        
        <div class="camera-content">
          <!-- Camera Permission Request -->
          <div v-if="!cameraPermission && !cameraError" class="permission-request">
            <div class="permission-icon">📷</div>
            <h4>Camera Access Required</h4>
            <p>Allow camera access to take photos of your work</p>
            <button @click="requestCameraAccess" class="permission-button" :disabled="requesting">
              {{ requesting ? 'Requesting...' : 'Allow Camera Access' }}
            </button>
          </div>

          <!-- Camera Error -->
          <div v-else-if="cameraError" class="camera-error">
            <div class="error-icon">⚠️</div>
            <h4>Camera Not Available</h4>
            <p>{{ cameraError }}</p>
            <div class="error-suggestions">
              <h5>Try these solutions:</h5>
              <ul>
                <li>✓ Allow camera permissions in your browser</li>
                <li>✓ Make sure no other app is using the camera</li>
                <li>✓ Refresh the page and try again</li>
                <li>✓ Use "Choose File" to upload existing photos</li>
              </ul>
            </div>
            <div class="error-actions">
              <button @click="requestCameraAccess" class="retry-button">
                🔄 Try Again
              </button>
              <button @click="$emit('close')" class="cancel-button">
                Cancel
              </button>
            </div>
          </div>

          <!-- Camera Interface -->
          <div v-else-if="cameraPermission" class="camera-interface">
            <!-- Camera Preview -->
            <div class="camera-preview">
              <video 
                ref="videoElement"
                autoplay
                playsinline
                muted
                class="camera-video"
                :class="{ 'capturing': isCapturing }"
              ></video>
              
              <!-- Camera Overlay -->
              <div class="camera-overlay">
                <div class="viewfinder">
                  <div class="viewfinder-corners"></div>
                </div>
                
                <!-- Camera Controls -->
                <div class="camera-controls">
                  <button @click="switchCamera" v-if="cameras.length > 1" class="switch-camera">
                    🔄 Switch Camera
                  </button>
                  <button @click="capturePhoto" class="capture-button" :disabled="isCapturing">
                    <span class="capture-icon">📸</span>
                    {{ isCapturing ? 'Capturing...' : 'Take Photo' }}
                  </button>
                  <button @click="$emit('close')" class="cancel-capture">
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <!-- Photo Preview -->
            <div v-if="capturedPhoto" class="photo-preview">
              <h4>📸 Photo Captured</h4>
              <div class="preview-container">
                <img :src="capturedPhoto" alt="Captured photo" class="preview-image">
                <div class="preview-actions">
                  <button @click="retakePhoto" class="retake-button">
                    🔄 Retake
                  </button>
                  <button @click="usePhoto" class="use-button">
                    ✅ Use This Photo
                  </button>
                </div>
              </div>
            </div>

            <!-- Camera Tips -->
            <div class="camera-tips">
              <h5>📋 Photo Tips:</h5>
              <ul>
                <li>✓ Ensure good lighting</li>
                <li>✓ Hold device steady</li>
                <li>✓ Make sure all work is visible</li>
                <li>✓ Avoid shadows and glare</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// Emits
const emit = defineEmits<{
  close: [];
  photoTaken: [file: File];
}>();

// State
const videoElement = ref<HTMLVideoElement | null>(null);
const cameraPermission = ref(false);
const cameraError = ref('');
const requesting = ref(false);
const isCapturing = ref(false);
const capturedPhoto = ref('');
const cameras = ref<MediaDeviceInfo[]>([]);
const currentCameraIndex = ref(0);
const stream = ref<MediaStream | null>(null);

// Camera access and setup
const requestCameraAccess = async () => {
  try {
    requesting.value = true;
    cameraError.value = '';
    
    console.log('📷 Requesting camera access...');
    
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access is not supported on this device or browser');
    }
    
    // Get available cameras
    const devices = await navigator.mediaDevices.enumerateDevices();
    cameras.value = devices.filter(device => device.kind === 'videoinput');
    
    console.log(`📹 Found ${cameras.value.length} camera(s)`);
    
    // Request camera permission and start stream
    await startCameraStream();
    
    cameraPermission.value = true;
    console.log('✅ Camera access granted');
    
  } catch (error: any) {
    console.error('❌ Camera access error:', error);
    handleCameraError(error);
  } finally {
    requesting.value = false;
  }
};

const startCameraStream = async () => {
  try {
    // Stop existing stream
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop());
    }
    
    // Camera constraints for high quality capture
    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        facingMode: 'environment' // Prefer back camera on mobile
      },
      audio: false
    };
    
    // Use specific camera if multiple available
    if (cameras.value.length > 0 && currentCameraIndex.value < cameras.value.length) {
      const selectedCamera = cameras.value[currentCameraIndex.value];
      (constraints.video as any).deviceId = { exact: selectedCamera.deviceId };
    }
    
    stream.value = await navigator.mediaDevices.getUserMedia(constraints);
    
    if (videoElement.value) {
      videoElement.value.srcObject = stream.value;
      console.log('📹 Camera stream started');
    }
    
  } catch (error: any) {
    console.error('❌ Error starting camera stream:', error);
    throw error;
  }
};

const switchCamera = async () => {
  if (cameras.value.length <= 1) return;
  
  currentCameraIndex.value = (currentCameraIndex.value + 1) % cameras.value.length;
  console.log(`📹 Switching to camera ${currentCameraIndex.value + 1}/${cameras.value.length}`);
  
  try {
    await startCameraStream();
  } catch (error) {
    console.error('Error switching camera:', error);
    cameraError.value = 'Failed to switch camera';
  }
};

const capturePhoto = async () => {
  if (!videoElement.value || isCapturing.value) return;
  
  try {
    isCapturing.value = true;
    console.log('📸 Capturing photo...');
    
    // Create canvas to capture frame
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Canvas not supported');
    }
    
    // Set canvas size to video size
    canvas.width = videoElement.value.videoWidth;
    canvas.height = videoElement.value.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(videoElement.value, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob/file
    canvas.toBlob((blob) => {
      if (blob) {
        // Create data URL for preview
        const reader = new FileReader();
        reader.onload = (e) => {
          capturedPhoto.value = e.target?.result as string;
        };
        reader.readAsDataURL(blob);
        
        // Store the blob for later use
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `photo-${timestamp}.jpg`, { 
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        // Store for use when user confirms
        (window as any).capturedPhotoFile = file;
        
        console.log('✅ Photo captured:', file.name, formatFileSize(file.size));
      }
    }, 'image/jpeg', 0.9); // High quality JPEG
    
  } catch (error: any) {
    console.error('❌ Error capturing photo:', error);
    cameraError.value = 'Failed to capture photo. Please try again.';
  } finally {
    isCapturing.value = false;
  }
};

const retakePhoto = () => {
  capturedPhoto.value = '';
  (window as any).capturedPhotoFile = null;
};

const usePhoto = () => {
  const file = (window as any).capturedPhotoFile;
  if (file) {
    emit('photoTaken', file);
    console.log('📤 Photo confirmed and sent');
  }
  emit('close');
};

const handleCameraError = (error: any) => {
  console.error('Camera error details:', error);
  
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    cameraError.value = 'Camera permission denied. Please allow camera access in your browser settings and refresh the page.';
  } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    cameraError.value = 'No camera found on this device. Please use "Choose File" to upload existing photos.';
  } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    cameraError.value = 'Camera is being used by another application. Please close other apps using the camera and try again.';
  } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
    cameraError.value = 'Camera does not support the required settings. Trying with basic settings...';
    
    // Retry with basic constraints
    setTimeout(async () => {
      try {
        const basicStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
        stream.value = basicStream;
        if (videoElement.value) {
          videoElement.value.srcObject = basicStream;
          cameraPermission.value = true;
          cameraError.value = '';
        }
      } catch (retryError) {
        cameraError.value = 'Camera not available on this device.';
      }
    }, 1000);
  } else if (error.name === 'NotSupportedError') {
    cameraError.value = 'Camera is not supported on this device or browser. Please use "Choose File" to upload photos.';
  } else {
    cameraError.value = `Camera error: ${error.message || 'Unknown error'}. Please try using "Choose File" instead.`;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return Math.round(bytes / 1024 / 1024) + ' MB';
};

// Cleanup camera stream when component unmounts
onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => {
      track.stop();
      console.log('📹 Camera stream stopped');
    });
  }
});

// Auto-request camera access on mount
onMounted(() => {
  requestCameraAccess();
});
</script>

<style scoped>
.camera-capture {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
}

.modal-overlay {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 15px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  color: #1f2937;
  font-size: 1.3rem;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  color: #6b7280;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.camera-content {
  padding: 25px;
}

/* Permission Request */
.permission-request {
  text-align: center;
  padding: 40px 20px;
}

.permission-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.permission-request h4 {
  color: #1f2937;
  font-size: 1.3rem;
  margin-bottom: 15px;
}

.permission-request p {
  color: #6b7280;
  margin-bottom: 30px;
  line-height: 1.6;
}

.permission-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.permission-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.permission-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Camera Error */
.camera-error {
  text-align: center;
  padding: 40px 20px;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.camera-error h4 {
  color: #dc2626;
  font-size: 1.3rem;
  margin-bottom: 15px;
}

.camera-error p {
  color: #6b7280;
  margin-bottom: 25px;
  line-height: 1.6;
}

.error-suggestions {
  background: #f9fafb;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 25px;
  text-align: left;
  display: inline-block;
}

.error-suggestions h5 {
  color: #1f2937;
  margin-bottom: 10px;
}

.error-suggestions ul {
  color: #374151;
  margin: 0;
  padding-left: 20px;
}

.error-suggestions li {
  margin-bottom: 5px;
}

.error-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.retry-button {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: #d97706;
}

.cancel-button {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background: #e5e7eb;
}

/* Camera Interface */
.camera-interface {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.camera-preview {
  position: relative;
  background: #000;
  border-radius: 15px;
  overflow: hidden;
  aspect-ratio: 16/9;
  max-height: 400px;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.camera-video.capturing {
  filter: brightness(1.2);
}

.camera-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
}

.viewfinder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 60%;
  border: 2px dashed rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  pointer-events: none;
}

.viewfinder-corners::before,
.viewfinder-corners::after,
.viewfinder-corners {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid #10b981;
}

.viewfinder-corners::before {
  top: -3px;
  left: -3px;
  border-right: none;
  border-bottom: none;
}

.viewfinder-corners::after {
  top: -3px;
  right: -3px;
  border-left: none;
  border-bottom: none;
}

.camera-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  background: rgba(0, 0, 0, 0.7);
  padding: 15px;
  border-radius: 10px;
}

.switch-camera {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.switch-camera:hover {
  background: rgba(255, 255, 255, 0.3);
}

.capture-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.capture-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}

.capture-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.capture-icon {
  font-size: 1.2rem;
}

.cancel-capture {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-capture:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Photo Preview */
.photo-preview {
  text-align: center;
}

.photo-preview h4 {
  color: #1f2937;
  margin-bottom: 20px;
}

.preview-container {
  background: #f9fafb;
  padding: 20px;
  border-radius: 15px;
  border: 2px dashed #e5e7eb;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
}

.preview-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.retake-button {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retake-button:hover {
  background: #d97706;
}

.use-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.use-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

/* Camera Tips */
.camera-tips {
  background: #f0f4ff;
  padding: 20px;
  border-radius: 10px;
  border-left: 4px solid #667eea;
}

.camera-tips h5 {
  color: #1f2937;
  margin-bottom: 10px;
}

.camera-tips ul {
  color: #374151;
  margin: 0;
  padding-left: 20px;
}

.camera-tips li {
  margin-bottom: 5px;
}

@media (max-width: 768px) {
  .modal {
    margin: 10px;
    max-width: none;
  }
  
  .camera-content {
    padding: 15px;
  }
  
  .camera-controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .preview-actions {
    flex-direction: column;
  }
  
  .error-actions {
    flex-direction: column;
  }
}

/* Responsive camera preview */
@media (max-width: 640px) {
  .camera-preview {
    aspect-ratio: 4/3;
  }
  
  .viewfinder {
    width: 90%;
    height: 70%;
  }
}
</style>
