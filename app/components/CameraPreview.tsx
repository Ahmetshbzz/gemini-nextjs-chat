// app/components/CameraPreview.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from "../../components/ui/button";
import { Video, VideoOff, RotateCcw } from "lucide-react";
import { GeminiWebSocket } from '../services/geminiWebSocket';
import { Base64 } from 'js-base64';

interface CameraPreviewProps {
  onTranscription: (text: string) => void;
}

export default function CameraPreview({ onTranscription }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const geminiWsRef = useRef<GeminiWebSocket | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const [isAudioSetup, setIsAudioSetup] = useState(false);
  const setupInProgressRef = useRef(false);
  const [isWebSocketReady, setIsWebSocketReady] = useState(false);
  const imageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [currentCamera, setCurrentCamera] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState(true);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  const cleanupAudio = useCallback(() => {
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const cleanupWebSocket = useCallback(() => {
    if (geminiWsRef.current) {
      geminiWsRef.current.disconnect();
      geminiWsRef.current = null;
    }
  }, []);

  // Simplify sendAudioData to just send continuously
  const sendAudioData = (b64Data: string) => {
    if (!geminiWsRef.current) return;
    geminiWsRef.current.sendMediaChunk(b64Data, "audio/pcm");
  };

  const toggleCamera = async () => {
    if (isStreaming && stream) {
      setIsStreaming(false);
      cleanupWebSocket();
      cleanupAudio();
      stream.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStream(null);
      setIsWebSocketReady(false);
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: currentCamera
          },
          audio: false
        });

        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: true,
          }
        });

        audioContextRef.current = new AudioContext({
          sampleRate: 16000,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
          videoRef.current.muted = true;
        }

        const combinedStream = new MediaStream([
          ...videoStream.getTracks(),
          ...audioStream.getTracks()
        ]);

        setStream(combinedStream);
        setIsStreaming(true);
      } catch (err) {
        console.error('Error accessing media devices:', err);
        cleanupAudio();
      }
    }
  };

  const switchCamera = async () => {
    if (!isStreaming || !stream) return;

    // Geçiş durumunu başlat
    setIsSwitchingCamera(true);

    try {
      // Mevcut video track'leri bul
      const videoTracks = stream.getVideoTracks();

      // Kamera yönünü değiştir
      const newFacingMode = currentCamera === 'user' ? 'environment' : 'user';
      setCurrentCamera(newFacingMode);

      // Arka kamera için ayna efektini tersine çevir
      if (newFacingMode === 'environment') {
        setIsMirrored(false);
      } else {
        setIsMirrored(true);
      }

      // Yeni kamera için track al
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode
        },
        audio: false
      });

      const newVideoTrack = newVideoStream.getVideoTracks()[0];

      // Eski video track'leri kapat ve kaldır
      videoTracks.forEach(track => {
        // Mevcut track'i durdur
        track.stop();

        // Mevcut track'i stream'den kaldır
        stream.removeTrack(track);
      });

      // Yeni video track'i stream'e ekle
      stream.addTrack(newVideoTrack);

      // Stream referansını güncellemeden sadece videoRef için içeriği güncelle
      // Bu sayede stream referansı korunur ve WebSocket bağlantısı kesilmez
      if (videoRef.current) {
        // srcObject değiştirmek yerine sadece içeriği güncelletebiliriz
        // çünkü stream referansı değişmedi

        // Eğer srcObject değiştirilmesi gerekiyorsa, şu şekilde yapılabilir
        // ancak yine de aynı stream referansını kullanmak önemli
        videoRef.current.srcObject = null;
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }

      // NOT: Yeni bir MediaStream nesnesi oluşturmuyoruz,
      // bu sayede stream referansı korunuyor ve bağlantı kopmuyor

    } catch (err) {
      console.error('Error switching camera:', err);
      // Hata durumunda WebSocket bağlantısını kontrol et ve gerekirse yenile
      if (!geminiWsRef.current || !isWebSocketReady) {
        initializeWebSocket();
      }
    } finally {
      // Geçiş durumunu kapat
      setIsSwitchingCamera(false);
    }
  };

  // WebSocket bağlantısını başlatmak için yardımcı fonksiyon
  const initializeWebSocket = useCallback(() => {
    if (!geminiWsRef.current) {
      setConnectionStatus('connecting');
      geminiWsRef.current = new GeminiWebSocket(
        (text) => {
          console.log("Received from Gemini:", text);
        },
        () => {
          console.log("[Camera] WebSocket setup complete, starting media capture");
          setIsWebSocketReady(true);
          setConnectionStatus('connected');
        },
        (isPlaying) => {
          setIsModelSpeaking(isPlaying);
        },
        (level) => {
          setOutputAudioLevel(level);
        },
        onTranscription
      );
      geminiWsRef.current.connect();
    }
  }, [onTranscription]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isStreaming) {
      setConnectionStatus('disconnected');
      return;
    }

    initializeWebSocket();

    return () => {
      if (!isStreaming) {
        if (imageIntervalRef.current) {
          clearInterval(imageIntervalRef.current);
          imageIntervalRef.current = null;
        }
        cleanupWebSocket();
        setIsWebSocketReady(false);
        setConnectionStatus('disconnected');
      }
    };
  }, [isStreaming, cleanupWebSocket, initializeWebSocket]);

  // Start image capture only after WebSocket is ready
  useEffect(() => {
    if (!isStreaming || !isWebSocketReady) return;

    console.log("[Camera] Starting image capture interval");
    imageIntervalRef.current = setInterval(captureAndSendImage, 1000);

    return () => {
      if (imageIntervalRef.current) {
        clearInterval(imageIntervalRef.current);
        imageIntervalRef.current = null;
      }
    };
  }, [isStreaming, isWebSocketReady]);

  // Update audio processing setup
  useEffect(() => {
    if (!isStreaming || !stream || !audioContextRef.current ||
      !isWebSocketReady || isAudioSetup || setupInProgressRef.current) return;

    let isActive = true;
    setupInProgressRef.current = true;

    const setupAudioProcessing = async () => {
      try {
        const ctx = audioContextRef.current;
        if (!ctx || ctx.state === 'closed' || !isActive) {
          setupInProgressRef.current = false;
          return;
        }

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        await ctx.audioWorklet.addModule('/worklets/audio-processor.js');

        if (!isActive) {
          setupInProgressRef.current = false;
          return;
        }

        audioWorkletNodeRef.current = new AudioWorkletNode(ctx, 'audio-processor', {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          processorOptions: {
            sampleRate: 16000,
            bufferSize: 4096,  // Larger buffer size like original
          },
          channelCount: 1,
          channelCountMode: 'explicit',
          channelInterpretation: 'speakers'
        });

        const source = ctx.createMediaStreamSource(stream);
        audioWorkletNodeRef.current.port.onmessage = (event) => {
          if (!isActive || isModelSpeaking) return;
          const { pcmData, level } = event.data;
          setAudioLevel(level);

          const pcmArray = new Uint8Array(pcmData);
          const b64Data = Base64.fromUint8Array(pcmArray);
          sendAudioData(b64Data);
        };

        source.connect(audioWorkletNodeRef.current);
        setIsAudioSetup(true);
        setupInProgressRef.current = false;

        return () => {
          source.disconnect();
          if (audioWorkletNodeRef.current) {
            audioWorkletNodeRef.current.disconnect();
          }
          setIsAudioSetup(false);
        };
      } catch (error) {
        console.error("[Camera] Audio processing setup error:", error);
        if (isActive) {
          cleanupAudio();
          setIsAudioSetup(false);
        }
        setupInProgressRef.current = false;
      }
    };

    console.log("[Camera] Starting audio processing setup");
    setupAudioProcessing();

    return () => {
      isActive = false;
      setIsAudioSetup(false);
      setupInProgressRef.current = false;
      if (audioWorkletNodeRef.current) {
        audioWorkletNodeRef.current.disconnect();
        audioWorkletNodeRef.current = null;
      }
    };
  }, [isStreaming, stream, isWebSocketReady, isModelSpeaking]);

  // Capture and send image
  const captureAndSendImage = () => {
    if (!videoRef.current || !videoCanvasRef.current || !geminiWsRef.current) return;

    const canvas = videoCanvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size to match video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (isMirrored) {
      // Eğer ayna görüntüsü aktifse, canvası çevirip çizim yap
      context.save();
      context.scale(-1, 1);
      context.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();
    } else {
      // Normal çizim
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    }

    // Convert to base64 and send
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    const b64Data = imageData.split(',')[1];
    geminiWsRef.current.sendMediaChunk(b64Data, "image/jpeg");
  };

  // Ayna görüntüsünü değiştirme fonksiyonu
  const toggleMirror = () => {
    setIsMirrored(!isMirrored);
  };

  return (
    <div className="space-y-2 md:space-y-4 w-full">
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-auto min-h-[70vh] md:min-h-[65vh] lg:min-h-[480px] object-cover bg-muted rounded-lg overflow-hidden mx-auto ${isMirrored ? 'scale-x-[-1]' : ''}`}
        />

        {/* Connection Status Overlay */}
        {isStreaming && connectionStatus !== 'connected' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
              <p className="text-white font-medium">
                {connectionStatus === 'connecting' ? 'Bağlanıyor...' : 'Bağlantı kesildi'}
              </p>
              <p className="text-white/70 text-sm">
                Lütfen bağlantı kurulurken bekleyin
              </p>
            </div>
          </div>
        )}

        {/* Kamera Değiştirme Overlay */}
        {isSwitchingCamera && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg backdrop-blur-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
          </div>
        )}

        {/* Ana kamera aç/kapat butonu */}
        <Button
          onClick={toggleCamera}
          size="icon"
          className={`absolute left-1/2 bottom-3 md:bottom-4 -translate-x-1/2 rounded-full w-10 h-10 md:w-12 md:h-12 backdrop-blur-sm transition-colors
            ${isStreaming
              ? 'bg-red-500/50 hover:bg-red-500/70 text-white'
              : 'bg-green-500/50 hover:bg-green-500/70 text-white'
            }`}
        >
          {isStreaming ? <VideoOff className="h-5 w-5 md:h-6 md:w-6" /> : <Video className="h-5 w-5 md:h-6 md:w-6" />}
        </Button>

        {/* Kamera değiştirme butonu */}
        {isStreaming && (
          <Button
            onClick={switchCamera}
            disabled={isSwitchingCamera}
            size="icon"
            className="absolute right-3 md:right-4 bottom-3 md:bottom-4 rounded-full w-8 h-8 md:w-10 md:h-10 backdrop-blur-sm transition-colors
              bg-blue-500/50 hover:bg-blue-500/70 text-white"
          >
            <RotateCcw className={`h-4 w-4 md:h-5 md:w-5 ${isSwitchingCamera ? 'animate-spin' : ''}`} />
          </Button>
        )}

        {/* Ayna görüntüsü butonu */}
        {isStreaming && (
          <Button
            onClick={toggleMirror}
            size="icon"
            className="absolute left-3 md:left-4 bottom-3 md:bottom-4 rounded-full w-8 h-8 md:w-10 md:h-10 backdrop-blur-sm transition-colors
              bg-yellow-500/50 hover:bg-yellow-500/70 text-white"
            title="Ayna görüntüsünü değiştir"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 md:h-5 md:w-5">
              <path d="M21 3H3"></path>
              <path d="M21 21H3"></path>
              <path d="M12 3v18"></path>
              <path d="M3 12h9"></path>
              <path d="M15 12h6"></path>
            </svg>
          </Button>
        )}
      </div>
      {isStreaming && (
        <div className="w-full max-w-[640px] h-2 rounded-full bg-green-100 mx-auto">
          <div
            className="h-full rounded-full transition-all bg-green-500"
            style={{
              width: `${isModelSpeaking ? outputAudioLevel : audioLevel}%`,
              transition: 'width 100ms ease-out'
            }}
          />
        </div>
      )}
      <canvas ref={videoCanvasRef} className="hidden" />
    </div>
  );
}
