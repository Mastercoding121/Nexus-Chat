import { getChats, getChatById as readChatById } from '../lib/persistence'

export const mockChats = getChats()

export function getChatById(id) {
  return readChatById(id)
}
