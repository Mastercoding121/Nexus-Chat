import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanNexusId, formatNexusId, getMemberNexusId, normalizeNexusId, parseNexusId } from '../src/utils/nexusId.js'

test('normalizes raw, formatted, prefixed, and zero-padded IDs', () => {
  assert.equal(normalizeNexusId('1012345678'), '1012345678')
  assert.equal(normalizeNexusId('10-1234-5678'), '1012345678')
  assert.equal(normalizeNexusId('# NEXUS-10 1234 5678'), '1012345678')
  assert.equal(normalizeNexusId('00001012345678'), '1012345678')
})

test('cleanNexusId returns null for unsafe values', () => {
  assert.equal(cleanNexusId('  #nexus-10-1234-5678  '), '1012345678')
  assert.equal(cleanNexusId('10-1234-567X'), null)
})

test('reports partial and invalid input distinctly', () => {
  assert.equal(parseNexusId('10-1234').status, 'partial_match')
  assert.equal(parseNexusId('NEXUS-10-1234-567X').status, 'invalid')
  assert.equal(parseNexusId('11-1234-5678').status, 'invalid')
  assert.equal(parseNexusId('10-1234-5678').status, 'exact_match')
})

test('formats confirmed IDs consistently', () => {
  assert.equal(formatNexusId('1012345678'), '10-1234-5678')
  assert.equal(getMemberNexusId({ member_id: '#NEXUS-10-1234-5678' }), '1012345678')
  assert.equal(getMemberNexusId({ nexus_id: '1012345678', member_id: '1099999999' }), '1012345678')
})
