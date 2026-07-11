import { useState, useRef } from 'react'
import { Smile, Paperclip, Mic, Send, Square } from 'lucide-react'
import StickerPicker from './StickerPicker'

export default function MessageInput({ onSendMessage }) {
  const [inputText, setInputText] = useState('')
  const [showStickers, setShowStickers] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordingIntervalRef = useRef(null)
  const audioChunksRef = useRef([])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputText.trim()) {
      onSendMessage({ content: inputText.trim(), type: 'text' })
      setInputText('')
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const url = URL.createObjectURL(file)
      let type = 'file'

      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'
      else if (file.type.startsWith('audio/')) type = 'voice'
      else if (
        file.type.includes('pdf') ||
        file.type.includes('document') ||
        file.type.includes('text') ||
        file.type.includes('spreadsheet') ||
        file.type.includes('presentation')
      ) type = 'file'

      onSendMessage({
        content: file.name,
        type,
        file_url: url,
        file_name: file.name,
        duration: type === 'voice' ? null : undefined,
      })
    })
    e.target.value = ''
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        onSendMessage({
          content: 'Voice message',
          type: 'voice',
          file_url: url,
          duration: recordingDuration,
        })
        stream.getTracks().forEach(track => track.stop())
        setRecordingDuration(0)
      }

      mediaRecorder.start()
      setIsRecording(true)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } catch {
      alert('Microphone access is required for voice messages')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    clearInterval(recordingIntervalRef.current)
    setIsRecording(false)
  }

  const handleStickerSelect = (sticker) => {
    onSendMessage({
      content: sticker.emoji,
      type: 'sticker',
    })
    setShowStickers(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 relative">
      {showStickers && (
        <StickerPicker
          onSelect={handleStickerSelect}
          onClose={() => setShowStickers(false)}
        />
      )}

      {isRecording ? (
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-full">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-600 dark:text-red-400">
              Recording... {recordingDuration}s
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white"
          >
            <Square className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowStickers(!showStickers)}
            className={`p-2 rounded-full transition-colors ${
              showStickers
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            <Smile className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400"
          >
            <Paperclip className="w-6 h-6" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-full text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {inputText.trim() ? (
            <button
              type="submit"
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white"
            >
              <Send className="w-6 h-6" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white"
            >
              <Mic className="w-6 h-6" />
            </button>
          )}
        </form>
      )}
    </div>
  )
}
