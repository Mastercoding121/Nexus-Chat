import { useState, useEffect } from 'react'
import SettingsRow from './SettingsRow'
import { Shield, Key, Copy, Check } from 'lucide-react'
import {
  isE2EEEnabled,
  setE2EEEnabled,
  getMyPublicKey,
  generateSecurityCode,
  initializeE2EE,
} from '../../../lib/crypto/e2ee'

export default function PrivacySettings() {
  const [e2eeEnabled, setE2ee] = useState(isE2EEEnabled())
  const [publicKey, setPublicKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [securityCode] = useState(() => generateSecurityCode('demo-chat'))

  useEffect(() => {
    initializeE2EE().then(() => getMyPublicKey()).then(setPublicKey)
  }, [])

  const handleToggleE2EE = (enabled) => {
    setE2EEEnabled(enabled)
    setE2ee(enabled)
  }

  const copyPublicKey = () => {
    navigator.clipboard.writeText(publicKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
        <Shield className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-green-800 dark:text-green-300">End-to-End Encryption</h3>
          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
            Messages are encrypted on your device using AES-256-GCM before being sent.
            Only you and the recipient can read them.
          </p>
        </div>
      </div>

      <SettingsRow label="Enable E2EE">
        <button
          onClick={() => handleToggleE2EE(!e2eeEnabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            e2eeEnabled ? 'bg-green-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              e2eeEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </SettingsRow>

      {e2eeEnabled && (
        <>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Your Public Key</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-gray-600 dark:text-gray-400 break-all font-mono bg-white dark:bg-gray-900 p-2 rounded">
                {publicKey ? `${publicKey.slice(0, 32)}...` : 'Generating...'}
              </code>
              <button
                onClick={copyPublicKey}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Security Code</p>
            <p className="text-2xl font-mono tracking-widest text-gray-700 dark:text-gray-300">
              {securityCode}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Compare this code with your contact to verify encryption.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
