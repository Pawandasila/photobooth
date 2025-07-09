"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, Settings, Edit3, Download, RotateCcw, Palette } from "lucide-react"

type FilterType = "90s" | "2000s" | "Noir" | "Fisheye" | "Rainbow" | "Glitch" | "Crosshatch" | "Vintage" | "Polaroid" | "Warm" | "Cool" | "Dramatic" | "Bright" | "Retro"

type StripDesign = "classic" | "college" | "yearbook" | "graduation" | "friends" | "memories" | "vintage" | "modern" | "colorful" | "minimal"

interface CapturedPhoto {
  dataUrl: string
  timestamp: number
  filter: FilterType
}

interface StripTemplate {
  name: StripDesign
  label: string
  bgColor: string
  textColor: string
  theme: string
  frames: boolean
}

interface PhotoSession {
  id: string
  photos: CapturedPhoto[]
  stripDesign: StripDesign
  title: string
  date: string
  participants: string[]
}

interface StripDesignOption {
  name: StripDesign
  label: string
  icon: string
}

export default function PhotoBoothApp() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [countdown, setCountdown] = useState<string | null>(null)
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const [currentFilter, setCurrentFilter] = useState<FilterType>("2000s")
  const [showPhotoStrip, setShowPhotoStrip] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showCurtains, setShowCurtains] = useState(true)
  const [curtainsAnimating, setCurtainsAnimating] = useState(false)
  const [selectedStripDesign, setSelectedStripDesign] = useState<StripDesign>("college")
  const [userName, setUserName] = useState("")
  const [groupName, setGroupName] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false);
  const [playShutterSound, setPlayShutterSound] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const photoStripCanvasRef = useRef<HTMLCanvasElement>(null)

  const availableFilters: { name: FilterType; label: string; css: string; icon: string }[] = [
    { name: "90s", label: "90s Vibe", css: "sepia(0.8) saturate(1.4) hue-rotate(315deg) brightness(1.1)", icon: "🎵" },
    { name: "2000s", label: "Y2K", css: "saturate(1.6) contrast(1.2) brightness(1.1) hue-rotate(10deg)", icon: "💾" },
    { name: "Noir", label: "Noir", css: "grayscale(1) contrast(1.3) brightness(0.9)", icon: "🎭" },
    { name: "Fisheye", label: "Fisheye", css: "contrast(1.2) saturate(1.3)", icon: "🐟" },
    { name: "Rainbow", label: "Rainbow", css: "hue-rotate(180deg) saturate(2) brightness(1.2)", icon: "🌈" },
    { name: "Glitch", label: "Glitch", css: "hue-rotate(90deg) saturate(2) contrast(1.5)", icon: "⚡" },
    { name: "Crosshatch", label: "Crosshatch", css: "contrast(1.4) brightness(0.8) saturate(0.8)", icon: "✏️" },
    { name: "Vintage", label: "Vintage", css: "sepia(0.5) contrast(1.1) saturate(1.2) brightness(1.1)", icon: "📸" },
    { name: "Polaroid", label: "Polaroid", css: "saturate(1.2) contrast(1.05) brightness(1.1) sepia(0.1)", icon: "📷" },
    { name: "Warm", label: "Warm", css: "sepia(0.2) saturate(1.3) hue-rotate(20deg) brightness(1.1)", icon: "🔥" },
    { name: "Cool", label: "Cool", css: "sepia(0.1) saturate(1.2) hue-rotate(200deg) brightness(1.0)", icon: "❄️" },
    { name: "Dramatic", label: "Dramatic", css: "contrast(1.5) saturate(1.1) brightness(0.9)", icon: "🎬" },
    { name: "Bright", label: "Bright", css: "saturate(1.4) contrast(1.1) brightness(1.3)", icon: "☀️" },
    { name: "Retro", label: "Retro", css: "sepia(0.3) saturate(1.5) hue-rotate(350deg) contrast(1.2)", icon: "📺" },
  ]

  const stripTemplates: StripTemplate[] = [
    { name: "classic", label: "Classic", bgColor: "#ffffff", textColor: "#000000", theme: "Simple & Clean", frames: true },
    { name: "college", label: "College Spirit", bgColor: "#1e3a8a", textColor: "#ffffff", theme: "School Colors", frames: true },
    { name: "yearbook", label: "Yearbook", bgColor: "#f8f9fa", textColor: "#495057", theme: "Vintage School", frames: true },
    { name: "graduation", label: "Graduation", bgColor: "#000000", textColor: "#ffd700", theme: "Elegant Black & Gold", frames: true },
    { name: "friends", label: "Best Friends", bgColor: "#ff6b9d", textColor: "#ffffff", theme: "Fun & Colorful", frames: false },
    { name: "memories", label: "Sweet Memories", bgColor: "#f3e5f5", textColor: "#7b1fa2", theme: "Soft & Nostalgic", frames: true },
    { name: "vintage", label: "Vintage", bgColor: "#8d6e63", textColor: "#ffffff", theme: "Retro Brown", frames: true },
    { name: "modern", label: "Modern", bgColor: "#263238", textColor: "#ffffff", theme: "Sleek & Minimal", frames: false },
    { name: "colorful", label: "Colorful", bgColor: "#ff5722", textColor: "#ffffff", theme: "Vibrant & Bold", frames: false },
    { name: "minimal", label: "Minimal", bgColor: "#fafafa", textColor: "#212121", theme: "Clean & Simple", frames: false },
  ]

 const backgroundClouds = [
    { width: 80, height: 50, left: 10, top: 15 },
    { width: 120, height: 70, left: 25, top: 8 },
    { width: 90, height: 55, left: 45, top: 20 },
    { width: 110, height: 65, left: 65, top: 12 },
    { width: 85, height: 45, left: 80, top: 25 },
    { width: 95, height: 60, left: 15, top: 45 },
    { width: 130, height: 75, left: 35, top: 40 },
    { width: 75, height: 40, left: 55, top: 50 },
    { width: 100, height: 55, left: 75, top: 35 },
    { width: 115, height: 70, left: 5, top: 70 },
    { width: 90, height: 50, left: 30, top: 75 },
    { width: 105, height: 65, left: 50, top: 80 },
    { width: 80, height: 45, left: 70, top: 65 },
    { width: 125, height: 80, left: 85, top: 75 },
  ]

  const playShutter = () => {
    if (playShutterSound) {
      try {
        // Create a simple click sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 800
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      } catch (error) {
        console.log("Audio playback not supported")
      }
    }
  }


  const initializePhotoBooth = async () => {
    setCurtainsAnimating(true)
    setTimeout(() => {
      setShowCurtains(false)
      requestCameraAccess()
    }, 2000)
  }

  const requestCameraAccess = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported by this browser")
      }

      const cameraConfigs = [
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
            frameRate: { ideal: 30, max: 60 }
          },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
        {
          video: {
            width: 640,
            height: 480,
          },
          audio: false,
        },
      ]

      let mediaStream = null
      let lastError = null

      for (const config of cameraConfigs) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(config)
          break
        } catch (error) {
          lastError = error
          continue
        }
      }

      if (!mediaStream) {
        throw lastError || new Error("Could not access camera")
      }

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream

        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error("Video element not found"))
            return
          }

          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current
                .play()
                .then(() => resolve(true))
                .catch(reject)
            }
          }

          videoRef.current.onerror = (error) => {
            reject(error)
          }

          setTimeout(() => {
            reject(new Error("Video loading timeout"))
          }, 10000)
        })
      }

      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
      const errorMessage = error instanceof Error ? error.message : "Unknown camera error"
      alert(
        `Camera Error: ${errorMessage}\n\nPlease:\n1. Allow camera permissions\n2. Make sure no other app is using the camera\n3. Try refreshing the page`,
      )
    }
  }, [])

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current
      video.srcObject = stream

      const handleVideoReady = () => {
        video.play().catch(console.error)
      }

      video.addEventListener("canplay", handleVideoReady)

      return () => {
        video.removeEventListener("canplay", handleVideoReady)
      }
    }
  }, [stream])

  const captureCurrentFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (!context) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const selectedFilter = availableFilters.find((f) => f.name === currentFilter)?.css || ""
    context.filter = selectedFilter

    context.save()
    context.scale(-1, 1)
    context.drawImage(video, -canvas.width, 0)
    context.restore()

    context.filter = "none"

    return canvas.toDataURL("image/jpeg", 0.9)
  }, [currentFilter, availableFilters])

  const handlePhotoCapture = useCallback(async () => {
    if (isCapturing || capturedPhotos.length >= 3) return

    setIsCapturing(true)

    const countdownSequence = ["3...", "2...", "1...", "Smile📸.."];

    for (let i = 0; i < countdownSequence.length; i++) {
      setCountdown(countdownSequence[i])
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    setCountdown(null)

    const photoData = captureCurrentFrame()
    if (photoData) {
      const newPhoto = {
        dataUrl: photoData,
        timestamp: Date.now(),
        filter: currentFilter,
      }
      setCapturedPhotos((prevPhotos) => {
        const updatedPhotos = [...prevPhotos, newPhoto]
        if (updatedPhotos.length === 3) {
          setTimeout(() => setShowPhotoStrip(true), 500)
        }
        return updatedPhotos
      })
    }

    setIsCapturing(false)
  }, [isCapturing, capturedPhotos.length, captureCurrentFrame])

  const createPhotoStrip = useCallback(() => {
    if (!photoStripCanvasRef.current || capturedPhotos.length !== 3) return

    const canvas = photoStripCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const template = stripTemplates.find(t => t.name === selectedStripDesign) || stripTemplates[0]
    
    const STRIP_WIDTH = 320
    const STRIP_HEIGHT = 800
    const PHOTO_WIDTH = 260
    const PHOTO_HEIGHT = 195
    const MARGIN = 30
    const PHOTO_SPACING = 25

    canvas.width = STRIP_WIDTH
    canvas.height = STRIP_HEIGHT

    // Create themed background
    if (template.name === "college") {
      const gradient = ctx.createLinearGradient(0, 0, 0, STRIP_HEIGHT)
      gradient.addColorStop(0, "#1e3a8a")
      gradient.addColorStop(0.3, "#3b82f6")
      gradient.addColorStop(0.7, "#1e40af")
      gradient.addColorStop(1, "#1e3a8a")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * STRIP_WIDTH
        const y = Math.random() * STRIP_HEIGHT
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (template.name === "graduation") {
      const gradient = ctx.createLinearGradient(0, 0, 0, STRIP_HEIGHT)
      gradient.addColorStop(0, "#000000")
      gradient.addColorStop(0.5, "#1a1a1a")
      gradient.addColorStop(1, "#000000")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
      
      ctx.fillStyle = "rgba(255, 215, 0, 0.2)"
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * STRIP_WIDTH
        const y = Math.random() * STRIP_HEIGHT
        ctx.fillRect(x, y, 12, 12)
      }
    } else if (template.name === "friends") {
      const gradient = ctx.createLinearGradient(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
      gradient.addColorStop(0, "#ff6b9d")
      gradient.addColorStop(0.25, "#ff8fab")
      gradient.addColorStop(0.5, "#ffa8cc")
      gradient.addColorStop(0.75, "#ffc9e0")
      gradient.addColorStop(1, "#ffe0f0")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * STRIP_WIDTH
        const y = Math.random() * STRIP_HEIGHT
        ctx.font = "20px Arial"
        ctx.fillText("💕", x, y)
      }
    } else if (template.name === "memories") {
      const gradient = ctx.createLinearGradient(0, 0, 0, STRIP_HEIGHT)
      gradient.addColorStop(0, "#f3e5f5")
      gradient.addColorStop(0.3, "#e1bee7")
      gradient.addColorStop(0.7, "#ce93d8")
      gradient.addColorStop(1, "#ba68c8")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
      for (let i = 0; i < 25; i++) {
        const x = Math.random() * STRIP_WIDTH
        const y = Math.random() * STRIP_HEIGHT
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (template.name === "vintage") {
      const gradient = ctx.createLinearGradient(0, 0, 0, STRIP_HEIGHT)
      gradient.addColorStop(0, "#8d6e63")
      gradient.addColorStop(0.5, "#a1887f")
      gradient.addColorStop(1, "#795548")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * STRIP_WIDTH
        const y = Math.random() * STRIP_HEIGHT
        ctx.fillRect(x, y, 1, 1)
      }
    } else if (template.name === "colorful") {
      const gradient = ctx.createLinearGradient(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
      gradient.addColorStop(0, "#ff5722")
      gradient.addColorStop(0.2, "#ff9800")
      gradient.addColorStop(0.4, "#ffc107")
      gradient.addColorStop(0.6, "#4caf50")
      gradient.addColorStop(0.8, "#2196f3")
      gradient.addColorStop(1, "#9c27b0")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
    } else if (template.name === "yearbook") {
      ctx.fillStyle = "#f8f9fa"
      ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
      
      ctx.strokeStyle = "#495057"
      ctx.lineWidth = 8
      ctx.strokeRect(4, 4, STRIP_WIDTH - 8, STRIP_HEIGHT - 8)
      
      ctx.strokeStyle = "#6c757d"
      ctx.lineWidth = 2
      ctx.strokeRect(15, 15, STRIP_WIDTH - 30, STRIP_HEIGHT - 30)
    } else if (template.name === "modern") {
      const gradient = ctx.createLinearGradient(0, 0, 0, STRIP_HEIGHT)
      gradient.addColorStop(0, "#263238")
      gradient.addColorStop(0.5, "#37474f")
      gradient.addColorStop(1, "#263238")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)"
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * STRIP_WIDTH
        const y = Math.random() * STRIP_HEIGHT
        const size = Math.random() * 30 + 10
        ctx.fillRect(x, y, size, size)
      }
    } else if (template.name === "minimal") {
      ctx.fillStyle = "#fafafa"
      ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
      
      ctx.strokeStyle = "#e0e0e0"
      ctx.lineWidth = 1
      ctx.strokeRect(10, 10, STRIP_WIDTH - 20, STRIP_HEIGHT - 20)
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, STRIP_HEIGHT)
      gradient.addColorStop(0, "#ffffff")
      gradient.addColorStop(1, "#f8f9fa")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
    }

    // Add decorative elements based on template
    if (template.name === "college") {
      // Add college-themed decorations
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
      for (let i = 0; i < 20; i++) {
        ctx.beginPath()
        ctx.arc(Math.random() * STRIP_WIDTH, Math.random() * STRIP_HEIGHT, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (template.name === "graduation") {
      // Add graduation cap decorations
      ctx.fillStyle = "rgba(255, 215, 0, 0.2)"
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * STRIP_WIDTH
        const y = Math.random() * STRIP_HEIGHT
        ctx.fillRect(x, y, 8, 8)
      }
    }

    // Add border if frames are enabled
     if (template.frames) {
      ctx.strokeStyle = template.textColor
      ctx.lineWidth = 4
      ctx.strokeRect(2, 2, STRIP_WIDTH - 4, STRIP_HEIGHT - 4)
    }

    // Add header
    ctx.fillStyle = template.textColor
    ctx.font = "bold 28px Arial, sans-serif"
    ctx.textAlign = "center"
    ctx.shadowColor = "rgba(0,0,0,0.3)"
    ctx.shadowBlur = 3
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    const headerText = groupName || "College Memories"
    ctx.fillText(headerText, STRIP_WIDTH / 2, 50);

    let loadedCount = 0
    capturedPhotos.forEach((photo, index) => {
      const img = new Image()
      img.onload = () => {
        const yPosition = 80 + index * (PHOTO_HEIGHT + PHOTO_SPACING)

        // Add photo shadow
        ctx.shadowColor = "rgba(0,0,0,0.4)"
        ctx.shadowBlur = 12
        ctx.shadowOffsetX = 6
        ctx.shadowOffsetY = 6

        // Photo background
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(MARGIN - 10, yPosition - 10, PHOTO_WIDTH + 20, PHOTO_HEIGHT + 20)

        // Draw photo
        ctx.drawImage(img, MARGIN, yPosition, PHOTO_WIDTH, PHOTO_HEIGHT)

        // Reset shadow
        ctx.shadowColor = "transparent"
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        // Photo border
        if (template.frames) {
          ctx.strokeStyle = template.textColor
          ctx.lineWidth = 3
          ctx.strokeRect(MARGIN - 2, yPosition - 2, PHOTO_WIDTH + 4, PHOTO_HEIGHT + 4)
        }

        // Add filter label (top right corner of photo)
        const filterUsed = availableFilters.find(f => f.name === photo.filter)
        if (filterUsed) {
          ctx.save()
          ctx.fillStyle = "rgba(0,0,0,0.5)"
          ctx.fillRect(MARGIN + PHOTO_WIDTH - 90, yPosition + 8, 85, 22)
          ctx.restore()
          ctx.fillStyle = "#fff"
          ctx.font = "bold 14px Arial, sans-serif"
          ctx.textAlign = "right"
          ctx.fillText(`${filterUsed.icon} ${filterUsed.label}`, MARGIN + PHOTO_WIDTH - 5, yPosition + 25)
        }

        // Serial number (top left corner of photo)
        ctx.save()
        ctx.fillStyle = "rgba(0,0,0,0.5)"
        ctx.fillRect(MARGIN + 4, yPosition + 8, 24, 22)
        ctx.restore()
        ctx.fillStyle = "#fff"
        ctx.font = "bold 16px Arial, sans-serif"
        ctx.textAlign = "left"
        ctx.fillText(`${index + 1}`, MARGIN + 10, yPosition + 25)

        loadedCount++

        if (loadedCount === 3) {
          // Add footer background for better visibility
          ctx.save()
          ctx.fillStyle = "rgba(0,0,0,0.5)"
          ctx.fillRect(0, STRIP_HEIGHT - 90, STRIP_WIDTH, 90)
          ctx.restore()

          // Add footer: date
          ctx.fillStyle = "#fff"
          ctx.font = "bold 20px Arial, sans-serif"
          ctx.textAlign = "center"
          ctx.shadowColor = "rgba(0,0,0,0.3)"
          ctx.shadowBlur = 2
          ctx.shadowOffsetX = 1
          ctx.shadowOffsetY = 1
          const currentDate = new Date().toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
          ctx.fillText(`📸 ${currentDate}`, STRIP_WIDTH / 2, STRIP_HEIGHT - 60)

          // Add 'Made by' text
          if (userName) {
            ctx.font = "bold 18px Arial, sans-serif"
            ctx.fillText(`Made by: ${userName}`, STRIP_WIDTH / 2, STRIP_HEIGHT - 35)
          }

          // Add template theme text
          ctx.font = "italic 15px Arial, sans-serif"
          ctx.fillText(template.theme, STRIP_WIDTH / 2, STRIP_HEIGHT - 15);
          ctx.shadowColor = "transparent"
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
        }
      }
      img.src = photo.dataUrl
    })
  }, [capturedPhotos, selectedStripDesign, userName, groupName, stripTemplates, availableFilters])

  useEffect(() => {
    if (showPhotoStrip && capturedPhotos.length === 3) {
      setTimeout(createPhotoStrip, 100)
    }
  }, [showPhotoStrip, capturedPhotos, createPhotoStrip])

  const downloadStrip = () => {
    if (!photoStripCanvasRef.current) return

    const downloadLink = document.createElement("a")
    const template = stripTemplates.find(t => t.name === selectedStripDesign)?.label || "college"
    const namePrefix = userName ? `${userName.replace(/\s+/g, '_')}-` : ""
    const groupPrefix = groupName ? `${groupName.replace(/\s+/g, '_')}-` : ""
    const timestamp = new Date().toISOString().split('T')[0]
    downloadLink.download = `${namePrefix}${groupPrefix}${template}-memories-${timestamp}.jpg`
    downloadLink.href = photoStripCanvasRef.current.toDataURL("image/jpeg", 0.9)
    downloadLink.click()
  }

  const resetPhotoBooth = () => {
    setShowPhotoStrip(false)
    setCapturedPhotos([])
    setCountdown(null)
    setShowSettings(false)
    setShowNameInput(false)
  }

  const handleTemplateSelect = (template: StripDesign) => {
    setSelectedStripDesign(template)
    setShowSettings(false)
  }

  if (showCurtains) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-200 via-pink-200 to-orange-300 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          {backgroundClouds.map((cloud, index) => (
            <div
              key={index}
              className="absolute bg-white rounded-full"
              style={{
                width: cloud.width,
                height: cloud.height,
                left: `${cloud.left}%`,
                top: `${cloud.top}%`,
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-center min-h-screen relative">
          <div className="text-center z-20">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-12 py-6 rounded-full text-3xl font-bold mb-8 shadow-2xl">
              🎓 College Memories Photo Booth
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">✨ Create Amazing Memory Strips!</h2>
              <div className="grid grid-cols-2 gap-4 text-white text-lg">
                <div className="flex items-center gap-2">
                  <span>🎨</span>
                  <span>14 Cool Filters</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📸</span>
                  <span>3 Perfect Photos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🎯</span>
                  <span>10 Strip Designs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👥</span>
                  <span>Perfect for Groups</span>
                </div>
              </div>
            </div>
            <div
              className="bg-gradient-to-b from-red-600 to-red-700 w-80 h-80 mx-auto rounded-2xl flex items-center justify-center shadow-2xl cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-3xl border-4 border-yellow-400"
              onClick={initializePhotoBooth}
            >
              <div className="text-center">
                <div className="text-yellow-400 text-6xl mb-4">🪙</div>
                <div className="text-yellow-400 text-lg font-bold leading-tight">
                  TAP TO START
                  <br />
                  YOUR PHOTO
                  <br />
                  ADVENTURE!
                </div>
              </div>
            </div>
            <div className="mt-8 text-white text-lg font-medium">
              Perfect for dorm rooms, graduation parties, and friendship memories! 📱✨
            </div>
          </div>

          <div className="absolute inset-0 z-10 pointer-events-none">
            <div
              className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-red-800 via-red-700 to-red-600 shadow-2xl transition-transform duration-2000 ease-in-out ${
                curtainsAnimating ? "-translate-x-full" : "translate-x-0"
              }`}
              style={{
                background: "repeating-linear-gradient(90deg, #991b1b 0px, #dc2626 20px, #b91c1c 40px)",
                boxShadow: "inset -20px 0 40px rgba(0,0,0,0.3), 20px 0 40px rgba(0,0,0,0.5)",
              }}
            >
              <div className="absolute inset-0 opacity-30">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full w-8 bg-gradient-to-r from-red-900 to-transparent"
                    style={{ left: `${i * 12.5}%` }}
                  />
                ))}
              </div>
            </div>

            <div
              className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-800 via-red-700 to-red-600 shadow-2xl transition-transform duration-2000 ease-in-out ${
                curtainsAnimating ? "translate-x-full" : "translate-x-0"
              }`}
              style={{
                background: "repeating-linear-gradient(270deg, #991b1b 0px, #dc2626 20px, #b91c1c 40px)",
                boxShadow: "inset 20px 0 40px rgba(0,0,0,0.3), -20px 0 40px rgba(0,0,0,0.5)",
              }}
            >
              <div className="absolute inset-0 opacity-30">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full w-8 bg-gradient-to-l from-red-900 to-transparent"
                    style={{ right: `${i * 12.5}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-yellow-600 to-yellow-800 shadow-lg z-30">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500 opacity-50"></div>
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1 w-6 h-6 bg-yellow-700 rounded-full shadow-md"
                  style={{ left: `${8 + i * 8}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-200 via-pink-200 to-orange-300 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          {backgroundClouds.map((cloud, index) => (
            <div
              key={index}
              className="absolute bg-white rounded-full"
              style={{
                width: cloud.width,
                height: cloud.height,
                left: `${cloud.left}%`,
                top: `${cloud.top}%`,
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-12 py-6 rounded-full text-3xl font-bold mb-8 shadow-2xl">
              🎓 College Memories Photo Booth
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-xl">
              <div className="text-white text-2xl font-bold mb-4">📸 Getting Your Camera Ready...</div>
              <div className="flex justify-center items-center gap-2 text-white text-lg">
                <div className="animate-spin text-2xl">📷</div>
                <span>Setting up the perfect shot!</span>
              </div>
              <div className="mt-4 text-white text-sm opacity-75">
                Make sure to allow camera permissions for the best experience ✨
              </div>
            </div>
            <div className="flex justify-center gap-4 text-white text-lg">
              <div className="flex items-center gap-2">
                <span className="animate-pulse">🎨</span>
                <span>Filters Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="animate-pulse">🖼️</span>
                <span>Templates Loaded</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="animate-pulse">✨</span>
                <span>Magic Prepared</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-200 via-pink-200 to-orange-300 relative overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        {backgroundClouds.map((cloud, index) => (
          <div
            key={index}
            className="absolute bg-white rounded-full"
            style={{
              width: cloud.width,
              height: cloud.height,
              left: `${cloud.left}%`,
              top: `${cloud.top}%`,
            }}
          />
        ))}
      </div>

      {/* Header with branding and controls */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg">
          🎓 College Memories Photo Booth
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <Button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-full font-medium shadow-lg backdrop-blur-sm"
        >
          ⚙️ Settings
        </Button>
        <Button
          onClick={() => setShowNameInput(!showNameInput)}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-full font-medium shadow-lg backdrop-blur-sm"
        >
          ✏️ Names
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-20 right-4 z-30 bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full">
          <h3 className="text-lg font-bold mb-4 text-gray-800">🎨 Strip Templates</h3>
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {stripTemplates.map((template) => (
              <Button
                key={template.name}
                onClick={() => handleTemplateSelect(template.name)}
                className={`text-sm p-3 rounded-lg text-left ${
                  selectedStripDesign === template.name
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                <div className="font-semibold">{template.label}</div>
                <div className="text-xs opacity-75">{template.theme}</div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Name Input Panel */}
      {showNameInput && (
        <div className="absolute top-20 right-4 z-30 bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full">
          <h3 className="text-lg font-bold mb-4 text-gray-800">✏️ Personalize Your Strip</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Group/Event Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Best Friends, Class of 2024"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        {!showPhotoStrip ? (
          <Card className="bg-black rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    filter: availableFilters.find((f) => f.name === currentFilter)?.css || "",
                    transform: currentFilter === "Fisheye" ? "scaleX(-1) scale(1.1)" : "scaleX(-1)",
                  }}
                />

                {countdown && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                    <div className="text-white text-6xl font-bold animate-pulse text-center">{countdown}</div>
                  </div>
                )}

                {capturedPhotos.length > 0 && (
                  <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                    {capturedPhotos.length}/3
                  </div>
                )}

                {/* Current template indicator */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {stripTemplates.find(t => t.name === selectedStripDesign)?.label}
                </div>
              </div>

              {/* Enhanced Filter Grid */}
              <div className="mt-6 space-y-4">
                <h3 className="text-white text-lg font-bold text-center">🎨 Choose Your Filter</h3>
                <div className="grid grid-cols-4 gap-2">
                  {availableFilters.map((filter) => (
                    <Button
                      key={filter.name}
                      variant={currentFilter === filter.name ? "default" : "ghost"}
                      size="sm"
                      className={`text-xs px-2 py-2 h-12 flex flex-col items-center justify-center ${
                        currentFilter === filter.name
                          ? "bg-yellow-500 text-black hover:bg-yellow-600 font-semibold"
                          : "text-white hover:bg-gray-800"
                      }`}
                      onClick={() => setCurrentFilter(filter.name)}
                    >
                      <span className="text-lg">{filter.icon}</span>
                      <span className="text-xs">{filter.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Captured Photos Preview */}
              {capturedPhotos.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-white text-sm font-bold mb-3 text-center">📸 Your Photos</h3>
                  <div className="flex gap-2 justify-center">
                    {capturedPhotos.map((photo, index) => (
                      <div key={index} className="w-16 h-12 rounded-lg overflow-hidden shadow-md">
                        <img
                          src={photo.dataUrl}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center mt-6">
                <Button
                  onClick={handlePhotoCapture}
                  disabled={isCapturing || capturedPhotos.length >= 3}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black p-0 shadow-xl disabled:opacity-50 transform hover:scale-105 transition-all duration-200"
                >
                  <Camera className="w-10 h-10" />
                </Button>
              </div>

              <div className="text-center mt-4">
                <p className="text-white text-sm font-medium">
                  {capturedPhotos.length === 0 && "📸 Click to take your first photo"}
                  {capturedPhotos.length === 1 && "🎉 Great! Take 2 more photos"}
                  {capturedPhotos.length === 2 && "🔥 One more photo to go!"}
                  {capturedPhotos.length === 3 && "✨ All photos taken! Creating your strip..."}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-3xl p-8 max-w-4xl w-full shadow-2xl border-0">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">🎓 Your College Memory Strip!</h2>
              <p className="text-purple-200">Perfect for sharing with friends and keeping forever</p>
            </div>
            
            <div className="flex gap-8 items-center justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <canvas ref={photoStripCanvasRef} className="max-w-[280px] w-full h-auto rounded-lg shadow-inner" />
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
                  <h3 className="text-white font-bold mb-2">Strip Design:</h3>
                  <p className="text-purple-200">{stripTemplates.find(t => t.name === selectedStripDesign)?.label}</p>
                  {userName && <p className="text-purple-200">Made by: {userName}</p>}
                  {groupName && <p className="text-purple-200">Event: {groupName}</p>}
                </div>

                <Button
                  onClick={resetPhotoBooth}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-purple-500"
                >
                  🔄 Take New Photos
                </Button>
                
                <Button
                  onClick={downloadStrip}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-green-500"
                >
                  💾 Download Strip
                </Button>

                <Button
                  onClick={() => {
                    setShowSettings(true)
                    setShowPhotoStrip(false)
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-blue-500"
                >
                  🎨 Try Different Design
                </Button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-purple-200 text-sm">
                Share your college memories with friends! Tag @pawan_dasila in your social posts 📱
              </p>
            </div>
          </Card>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
