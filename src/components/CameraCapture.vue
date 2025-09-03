<template>
  <div class="camera-capture">
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>📷 {{ getModalTitle() }}</h3>
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
                :class="{ 'capturing': isCapturing, 'video-ready': videoReady }"
                @loadedmetadata="() => console.log('📹 Video loadedmetadata event')"
                @canplay="() => console.log('📹 Video canplay event')"
                @play="() => console.log('📹 Video play event')"
                @error="(e) => console.error('📹 Video error event:', e)"
              ></video>
              
              <!-- Loading overlay -->
              <div v-if="!videoReady" class="video-loading">
                <div class="loading-spinner-small"></div>
                <p>Loading camera...</p>
              </div>
              
              <!-- Countdown Overlay -->
              <div v-if="countdownActive" class="countdown-overlay">
                <div class="countdown-circle">
                  <div class="countdown-number">{{ countdownValue }}</div>
                  <div class="countdown-text">Get Ready!</div>
                </div>
              </div>

              <!-- Camera Overlay -->
              <div class="camera-overlay">
                <div class="viewfinder" :data-page-info="getPageInfo()">
                  <div class="viewfinder-corners"></div>
                </div>
                
                <!-- Camera Controls -->
                <div class="camera-controls">
                  <button @click="switchCamera" v-if="cameras.length > 1" class="switch-camera">
                    🔄 Switch Camera
                  </button>
                  <button @click="startCountdown" class="capture-button" :disabled="isCapturing || !videoReady || countdownActive">
                    <span class="capture-icon">📸</span>
                    {{ getButtonText() }}
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
              <h5>📋 Paper Capture Tips:</h5>
              <ul>
                <li>✓ Position paper within the dashed outline</li>
                <li>✓ Ensure good, even lighting</li>
                <li>✓ Hold device steady and parallel to paper</li>
                <li>✓ Fill the frame - get close to the paper</li>
                <li>✓ Avoid shadows and glare on the paper</li>
                <li>✓ Make sure all text/work is clearly visible</li>
                <li>⏰ 3-second countdown gives you time to steady the camera</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fullscreen Photo Overlay -->
    <div v-if="isFullscreen && capturedPhoto" class="fullscreen-overlay" @click="toggleFullscreen">
      <div class="fullscreen-content" @click.stop>
        <div class="fullscreen-header">
          <h3>📸 Full Size Preview</h3>
          <button @click="toggleFullscreen" class="fullscreen-close">×</button>
        </div>
        <div class="fullscreen-image-container">
          <img :src="capturedPhoto" alt="Full size preview" class="fullscreen-image">
        </div>
        <div class="fullscreen-actions">
          <button @click="retakePhoto" class="fullscreen-retake">
            🔄 Retake Photo
          </button>
          <button @click="usePhoto" class="fullscreen-use">
            ✅ Use This Photo
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

// Props
const props = defineProps<{
  currentPage?: number;
  totalPages?: number;
  pageLabel?: string;
  isMultiPage?: boolean;
}>();

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
const isFullscreen = ref(false);
const cameras = ref<MediaDeviceInfo[]>([]);
const currentCameraIndex = ref(0);
const stream = ref<MediaStream | null>(null);
const videoReady = ref(false);
const initializing = ref(false);
const countdownActive = ref(false);
const countdownValue = ref(0);

// Helper function to wait for video element to be available
const waitForVideoElement = async (): Promise<void> => {
  // First wait for next tick to ensure DOM is updated
  await nextTick();
  
  return new Promise((resolve, reject) => {
    const maxAttempts = 50; // 5 seconds max wait
    let attempts = 0;
    
    const checkVideoElement = () => {
      attempts++;
      console.log(`📹 Checking for video element, attempt ${attempts}/${maxAttempts}`);
      
      if (videoElement.value) {
        console.log('📹 Video element found!');
        resolve();
        return;
      }
      
      if (attempts >= maxAttempts) {
        console.error('❌ Video element not found after maximum attempts');
        reject(new Error('Video element not available after waiting'));
        return;
      }
      
      // Wait 100ms and try again
      setTimeout(checkVideoElement, 100);
    };
    
    checkVideoElement();
  });
};

// Camera access and setup
const requestCameraAccess = async () => {
  if (initializing.value) {
    console.log('📷 Already initializing camera, skipping...');
    return;
  }
  
  try {
    initializing.value = true;
    requesting.value = true;
    cameraError.value = '';
    
    console.log('📷 Requesting camera access...');
    
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access is not supported on this device or browser');
    }
    
    // First get a basic stream to get permission, then enumerate devices
    console.log('📹 Getting basic camera access for permissions...');
    let tempStream;
    try {
      tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      console.log('📹 Basic camera permission granted');
      
      // Stop the temp stream immediately
      tempStream.getTracks().forEach(track => track.stop());
      console.log('📹 Temp stream stopped');
    } catch (permError) {
      console.error('❌ Basic camera permission denied:', permError);
      throw permError;
    }
    
    // Now enumerate devices (this works better after getting permission)
    const devices = await navigator.mediaDevices.enumerateDevices();
    cameras.value = devices.filter(device => device.kind === 'videoinput');
    
    console.log(`📹 Found ${cameras.value.length} camera(s):`, cameras.value.map(c => c.label || 'Unknown'));
    
    // Set camera permission first so video element is rendered
    cameraPermission.value = true;
    console.log('📹 Camera permission granted, video element should now be available');
    
    // Request camera permission and start stream
    console.log('📹 About to start camera stream...');
    await startCameraStream();
    
    console.log('✅ Camera access granted and stream started');
    
  } catch (error: any) {
    console.error('❌ Camera access error:', error);
    handleCameraError(error);
  } finally {
    requesting.value = false;
    initializing.value = false;
  }
};

const startCameraStream = async () => {
  try {
    console.log('📹 startCameraStream called');
    
    // Stop existing stream
    if (stream.value) {
      console.log('📹 Stopping existing stream');
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
      console.log('📹 Using specific camera:', selectedCamera.label || 'Unknown');
      (constraints.video as any).deviceId = { exact: selectedCamera.deviceId };
    }
    
    console.log('📹 Requesting getUserMedia with constraints:', constraints);
    stream.value = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('📹 getUserMedia successful, stream obtained:', stream.value);
    
    // Wait for video element to be available in DOM
    console.log('📹 Waiting for video element to be available...');
    await waitForVideoElement();
    
    if (videoElement.value) {
      console.log('📹 Setting video srcObject:', stream.value);
      videoElement.value.srcObject = stream.value;
      
      // Force video to play (important for some browsers)
      try {
        await videoElement.value.play();
        console.log('📹 Video play() called successfully');
      } catch (playError) {
        console.warn('⚠️ Video play() failed (this might be okay):', playError);
      }
      
      // Wait for video metadata to load - CRITICAL for Mac/Chrome
      await new Promise<void>((resolve, reject) => {
        if (!videoElement.value) {
          reject(new Error('Video element not available'));
          return;
        }
        
        const video = videoElement.value;
        
        const onLoadedMetadata = () => {
          console.log('📹 Video metadata loaded:', {
            width: video.videoWidth,
            height: video.videoHeight,
            readyState: video.readyState,
            srcObject: video.srcObject,
            paused: video.paused
          });
          videoReady.value = true;
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
          resolve();
        };
        
        const onError = (error: Event) => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
          reject(new Error('Video failed to load'));
        };
        
        // Check if metadata is already loaded
        if (video.readyState >= 1) { // HAVE_METADATA
          console.log('📹 Video metadata already loaded, proceeding immediately');
          onLoadedMetadata();
        } else {
          console.log('📹 Waiting for video metadata to load...');
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          // Also listen for canplay event as a fallback
          const onCanPlay = () => {
            console.log('📹 Video canplay event fired');
            if (video.readyState >= 1) {
              video.removeEventListener('canplay', onCanPlay);
              onLoadedMetadata();
            }
          };
          video.addEventListener('canplay', onCanPlay);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            console.warn('⚠️ Video metadata load timeout');
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            video.removeEventListener('canplay', onCanPlay);
            reject(new Error('Video metadata load timeout'));
          }, 10000);
        }
      });
      
      console.log('✅ Camera stream started and ready');
    } else {
      console.error('❌ Video element not available when trying to set stream');
      throw new Error('Video element not available');
    }
    
  } catch (error: any) {
    console.error('❌ Error starting camera stream:', error);
    
    // Try with basic constraints as fallback
    console.log('📹 Trying fallback with basic constraints...');
    try {
      const basicConstraints = { video: true, audio: false };
      console.log('📹 Requesting getUserMedia with basic constraints:', basicConstraints);
      stream.value = await navigator.mediaDevices.getUserMedia(basicConstraints);
      console.log('📹 Basic getUserMedia successful:', stream.value);
      
      // Wait for video element to be available in DOM (fallback)
      console.log('📹 Waiting for video element to be available (fallback)...');
      await waitForVideoElement();
      
      if (videoElement.value) {
        console.log('📹 Setting video srcObject (basic):', stream.value);
        videoElement.value.srcObject = stream.value;
        
        // Force video to play (important for some browsers)
        try {
          await videoElement.value.play();
          console.log('📹 Video play() called successfully (basic)');
        } catch (playError) {
          console.warn('⚠️ Video play() failed (this might be okay):', playError);
        }
        
        // For basic stream, just set ready immediately
        videoReady.value = true;
        console.log('✅ Basic camera stream started and ready');
      }
    } catch (basicError) {
      console.error('❌ Even basic camera constraints failed:', basicError);
      throw error; // Throw original error
    }
  }
};

const switchCamera = async () => {
  if (cameras.value.length <= 1) return;
  
  videoReady.value = false; // Reset ready state when switching
  currentCameraIndex.value = (currentCameraIndex.value + 1) % cameras.value.length;
  console.log(`📹 Switching to camera ${currentCameraIndex.value + 1}/${cameras.value.length}`);
  
  try {
    await startCameraStream();
  } catch (error) {
    console.error('Error switching camera:', error);
    cameraError.value = 'Failed to switch camera';
  }
};

// Button text helper
const getButtonText = () => {
  if (isCapturing.value) return 'Capturing...';
  if (!videoReady.value) return 'Camera Loading...';
  if (countdownActive.value) return `Taking in ${countdownValue.value}...`;
  return 'Take Photo (3s delay)';
};

// Start countdown before taking photo
const startCountdown = async () => {
  if (!videoElement.value || isCapturing.value || countdownActive.value) return;
  
  try {
    countdownActive.value = true;
    console.log('⏰ Starting 3-second countdown...');
    
    // Countdown from 3 to 1
    for (let i = 3; i >= 1; i--) {
      countdownValue.value = i;
      console.log(`⏰ Countdown: ${i}`);
      
      // Play a subtle beep sound (optional)
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(i === 1 ? 800 : 600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (audioError) {
        // Audio failed, continue silently
        console.log('Audio not available for countdown beep');
      }
      
      // Wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Take the photo
    console.log('📸 Countdown complete, taking photo!');
    await capturePhoto();
    
  } finally {
    countdownActive.value = false;
    countdownValue.value = 0;
  }
};

const capturePhoto = async () => {
  if (!videoElement.value || isCapturing.value) return;
  
  try {
    isCapturing.value = true;
    console.log('📸 Capturing photo...');
    
    const video = videoElement.value;
    
    // Validate video is ready - CRITICAL CHECK for Mac/Chrome
    if (video.readyState < 2) { // HAVE_CURRENT_DATA
      throw new Error('Video not ready for capture. Please wait a moment and try again.');
    }
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      throw new Error('Video dimensions not available. Please refresh and try again.');
    }
    
    console.log('📹 Video ready for capture:', {
      width: video.videoWidth,
      height: video.videoHeight,
      readyState: video.readyState
    });
    
    // Create canvas to capture frame
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Canvas not supported');
    }
    
    // Calculate crop dimensions for 8.5x11 portrait aspect ratio
    const paperAspectRatio = 8.5 / 11; // 0.739
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    
    let cropWidth, cropHeight, cropX, cropY;
    
    if (videoAspectRatio > paperAspectRatio) {
      // Video is wider than paper ratio - crop width
      cropHeight = video.videoHeight;
      cropWidth = cropHeight * paperAspectRatio;
      cropX = (video.videoWidth - cropWidth) / 2;
      cropY = 0;
    } else {
      // Video is taller than paper ratio - crop height  
      cropWidth = video.videoWidth;
      cropHeight = cropWidth / paperAspectRatio;
      cropX = 0;
      cropY = (video.videoHeight - cropHeight) / 2;
    }
    
    // Set canvas size to cropped paper dimensions (high resolution)
    const outputWidth = Math.min(1700, cropWidth); // Max width for 8.5" at ~200 DPI
    const outputHeight = outputWidth / paperAspectRatio;
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    
    console.log('🖼️ Paper crop calculated:', {
      videoDimensions: `${video.videoWidth}x${video.videoHeight}`,
      videoAspectRatio: videoAspectRatio.toFixed(3),
      paperAspectRatio: paperAspectRatio.toFixed(3),
      cropArea: `${cropWidth.toFixed(0)}x${cropHeight.toFixed(0)} at (${cropX.toFixed(0)}, ${cropY.toFixed(0)})`,
      outputDimensions: `${canvas.width}x${canvas.height}`
    });
    
    // Draw cropped video frame to canvas
    context.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight,  // Source crop area
      0, 0, canvas.width, canvas.height     // Destination (full canvas)
    );
    
    // Verify something was drawn to canvas
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const hasData = imageData.data.some(pixel => pixel > 0);
    
    if (!hasData) {
      throw new Error('Failed to capture image data. Please try again.');
    }
    
    // Convert to blob/file
    canvas.toBlob((blob) => {
      if (blob && blob.size > 0) {
        // Create data URL for preview
        const reader = new FileReader();
        reader.onload = (e) => {
          capturedPhoto.value = e.target?.result as string;
        };
        reader.readAsDataURL(blob);
        
        // Store the blob for later use
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let filename = `paper-capture-${timestamp}.jpg`;
        
        // Add page information to filename if multi-page
        if (props.isMultiPage && props.currentPage) {
          const pageLabel = props.pageLabel ? 
            props.pageLabel.replace(/[^a-zA-Z0-9]/g, '-') : 
            `page${props.currentPage}`;
          filename = `paper-capture-${pageLabel}-${timestamp}.jpg`;
        }
        
        const file = new File([blob], filename, { 
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        // Store for use when user confirms
        (window as any).capturedPhotoFile = file;
        
        console.log('✅ Photo captured successfully:', {
          filename: file.name,
          size: formatFileSize(file.size),
          dimensions: `${canvas.width}x${canvas.height}`
        });
      } else {
        throw new Error('Failed to create image file. Please try again.');
      }
    }, 'image/jpeg', 0.9); // High quality JPEG
    
  } catch (error: any) {
    console.error('❌ Error capturing photo:', error);
    cameraError.value = error.message || 'Failed to capture photo. Please try again.';
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

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
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

// Multi-page helper functions
const getModalTitle = () => {
  if (props.isMultiPage && props.currentPage && props.totalPages) {
    const pageLabel = props.pageLabel || `Page ${props.currentPage}`;
    return `Take Photo - ${pageLabel} (${props.currentPage}/${props.totalPages})`;
  }
  return 'Take Photo';
};

const getPageInfo = () => {
  if (props.isMultiPage && props.currentPage) {
    const pageLabel = props.pageLabel || `Page ${props.currentPage}`;
    return `📄 ${pageLabel} - 8.5" × 11"`;
  }
  return '📄 8.5" × 11" Paper';
};

// Cleanup camera stream when component unmounts
onUnmounted(() => {
  console.log('🧹 CameraCapture component unmounting, cleaning up stream');
  if (stream.value) {
    stream.value.getTracks().forEach(track => {
      track.stop();
      console.log('📹 Camera stream stopped on unmount');
    });
  }
});

// Auto-request camera access on mount
onMounted(() => {
  console.log('📷 CameraCapture component mounted, requesting camera access');
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

.camera-video:not(.video-ready) {
  opacity: 0.7;
}

.video-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  z-index: 10;
}

.loading-spinner-small {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

.video-loading p {
  margin: 0;
  font-size: 0.9rem;
}

/* Countdown Overlay */
.countdown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.countdown-circle {
  width: 150px;
  height: 150px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  animation: countdown-pulse 1s ease-in-out infinite;
}

.countdown-number {
  font-size: 4rem;
  font-weight: bold;
  color: #10b981;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  animation: countdown-scale 1s ease-in-out infinite;
}

.countdown-text {
  font-size: 1rem;
  color: white;
  margin-top: 8px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

@keyframes countdown-pulse {
  0%, 100% {
    transform: scale(1);
    border-color: rgba(255, 255, 255, 0.3);
  }
  50% {
    transform: scale(1.05);
    border-color: rgba(16, 185, 129, 0.6);
  }
}

@keyframes countdown-scale {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
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
    /* 8.5x11 portrait aspect ratio (0.739:1) */
    width: 42%;
    aspect-ratio: 8.5 / 11;
    border: 2px dashed rgba(255, 255, 255, 0.8);
    border-radius: 10px;
    pointer-events: none;
  }
  
  /* Paper outline styling */
  .viewfinder::before {
    content: attr(data-page-info);
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
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

.fullscreen-preview-container {
  width: 100%;
  max-width: 100%;
}

.preview-image-wrapper {
  position: relative;
  margin-bottom: 20px;
}

.fullscreen-preview-image {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  background: white;
  border: 3px solid #e5e7eb;
}

.preview-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
}

.fullscreen-btn {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.fullscreen-btn:hover {
  background: rgba(0, 0, 0, 0.9);
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

/* Enhanced Photo Preview Styles */
.preview-header {
  text-align: center;
  margin-bottom: 25px;
}

.preview-header h4 {
  color: #1f2937;
  font-size: 1.3rem;
  margin-bottom: 8px;
}

.preview-header p {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

.fullscreen-preview-container {
  width: 100%;
}

.preview-image-wrapper {
  position: relative;
  margin-bottom: 20px;
}

.preview-image {
  width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
}

.preview-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
}

.fullscreen-btn {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.fullscreen-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

.retake-button, .use-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 140px;
  text-align: center;
}

.retake-button {
  background: white;
  border-color: #ef4444;
  color: #dc2626;
}

.retake-button:hover {
  background: #fef2f2;
  border-color: #dc2626;
}

.use-button {
  background: white;
  border-color: #10b981;
  color: #059669;
}

.use-button:hover {
  background: #f0fdf4;
  border-color: #059669;
}

.button-icon {
  font-size: 1.5rem;
}

.button-text {
  font-weight: 600;
  font-size: 1rem;
}

.button-desc {
  font-size: 0.8rem;
  opacity: 0.8;
}

.review-tips {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  border: 1px solid #bae6fd;
}

.review-tips h5 {
  color: #1e40af;
  margin-bottom: 10px;
  font-size: 1rem;
}

.review-tips ul {
  color: #1f2937;
  margin: 0;
  padding-left: 20px;
}

.review-tips li {
  margin-bottom: 5px;
  font-size: 0.9rem;
}

/* Fullscreen overlay styles */
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.fullscreen-content {
  width: 95vw;
  height: 95vh;
  background: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fullscreen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.fullscreen-header h3 {
  margin: 0;
  color: #1f2937;
}

.fullscreen-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 5px;
  border-radius: 4px;
}

.fullscreen-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.fullscreen-image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f9fafb;
}

.fullscreen-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.fullscreen-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  padding: 20px;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.fullscreen-retake, .fullscreen-use {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid;
}

.fullscreen-retake {
  background: white;
  border-color: #ef4444;
  color: #dc2626;
}

.fullscreen-retake:hover {
  background: #fef2f2;
}

.fullscreen-use {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.fullscreen-use:hover {
  background: #059669;
}
</style>
