const NEXUS_ID_PATTERN = /^10\d{8}$/

function stripPrefix(value) {
  return String(value || '')
    .trim()
    .replace(/^#\s*/, '')
    .replace(/^NEXUS(?:\s*[-:]?\s*)/i, '')
}

export function parseNexusId(value) {
  const source = stripPrefix(value)
  if (!source) return { status: 'partial_match', value: '', displayValue: '' }
  if (!/^[0-9\s-]+$/.test(source)) return { status: 'invalid', value: '', displayValue: source }

  const digits = source.replace(/[\s-]/g, '').replace(/^0+(?=\d)/, '')
  if (digits.length < 10) {
    return { status: 'partial_match', value: digits, displayValue: formatNexusId(digits) }
  }
  if (!NEXUS_ID_PATTERN.test(digits)) {
    return { status: 'invalid', value: digits, displayValue: formatNexusId(digits) }
  }
  return { status: 'exact_match', value: digits, displayValue: formatNexusId(digits) }
}

export function normalizeNexusId(value) {
  return cleanNexusId(value)
}

export function cleanNexusId(input) {
  const parsed = parseNexusId(input)
  return parsed.status === 'exact_match' ? parsed.value : null
}

export function getMemberNexusId(member) {
  return normalizeNexusId(member?.nexus_id || member?.member_id || member?.nexusId || member?.memberId)
}

export function formatNexusId(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
}

export { NEXUS_ID_PATTERN }
