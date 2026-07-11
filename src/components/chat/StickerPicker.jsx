import { useState } from 'react'
import { X } from 'lucide-react'
import { STICKER_PACKS } from '../../data/stickers'

export default function StickerPicker({ onSelect, onClose }) {
  const [activePack, setActivePack] = useState(STICKER_PACKS[0].id)
  const pack = STICKER_PACKS.find(p => p.id === activePack)

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          {STICKER_PACKS.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePack(p.id)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                activePack === p.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-6 gap-2 p-4 max-h-48 overflow-y-auto">
        {pack?.stickers.map(sticker => (
          <button
            key={sticker.id}
            onClick={() => onSelect(sticker)}
            className="text-3xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={sticker.label}
          >
            {sticker.emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
