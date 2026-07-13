import React from 'react'

function formatNexusIdForInput(raw) {
  const s = String(raw || '').replace(/\D/g, '') // Remove all non-digit characters
  if (s.length >= 2) {
    let formatted = s.slice(0, 2)
    if (s.length >= 6) {
      formatted += '-' + s.slice(2, 6)
      if (s.length >= 10) {
        formatted += '-' + s.slice(6, 10)
      }
    }
    return formatted
  }
  return s
}

export default function NexusNumberInput({ value, onChange, className, placeholder = "10-xxxx-xxxx" }) {
  const handleChange = (e) => {
    const formatted = formatNexusIdForInput(e.target.value)
    onChange(formatted)
  }

  return (
    <input
      type="tel"
      inputMode="numeric"
      pattern="[0-9\-]*"
      maxLength={12}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  )
}

export { formatNexusIdForInput }
