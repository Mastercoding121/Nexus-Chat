import React from 'react'

function formatNexusIdForInput(raw) {
  const digits = String(raw || '').replace(/\D/g, '') // Remove all non-digit characters
  return digits.slice(0, 10)
}

export default function NexusNumberInput({ value, onChange, className, placeholder = "1012345678" }) {
  const handleChange = (e) => {
    const formatted = formatNexusIdForInput(e.target.value)
    onChange(formatted)
  }

  return (
    <input
      type="tel"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={10}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  )
}

export { formatNexusIdForInput }
