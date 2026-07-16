function createSeedChats() {
  return [
    {
      id: '1',
      title: 'Alice Smith',
      type: 'private',
      avatar_url: null,
      last_message: 'Hey, how are you?',
      last_message_time: new Date().toISOString(),
      unread_count: 2,
      encrypted: true,
      messages: [
        {
          id: 'seed-1',
          sender_id: 'other',
          content: 'Hey! How are you doing?',
          type: 'text',
          encrypted: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'seed-2',
          sender_id: 'me',
          content: 'I\'m doing great, thanks for asking!',
          type: 'text',
          encrypted: false,
          created_at: new Date(Date.now() - 3500000).toISOString(),
        },
      ],
    },
    {
      id: '2',
      title: 'Nexus Team',
      type: 'group',
      avatar_url: null,
      last_message: 'Meeting tomorrow at 10am',
      last_message_time: new Date(Date.now() - 3600000).toISOString(),
      unread_count: 0,
      encrypted: false,
      messages: [
        {
          id: 'seed-3',
          sender_id: 'other',
          content: 'Meeting tomorrow at 10am',
          type: 'text',
          encrypted: false,
          created_at: new Date(Date.now() - 3700000).toISOString(),
        },
      ],
    },
    {
      id: '3',
      title: 'Bob Johnson',
      type: 'private',
      avatar_url: null,
      last_message: 'Thanks for the help!',
      last_message_time: new Date(Date.now() - 7200000).toISOString(),
      unread_count: 0,
      encrypted: true,
      messages: [
        {
          id: 'seed-4',
          sender_id: 'other',
          content: 'Thanks for the help!',
          type: 'text',
          encrypted: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
    },
  ]
}

export const mockChats = createSeedChats()

export { getChatById } from '../lib/persistence'
