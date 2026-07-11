export default function ContactsPanel() {
  const contacts = [
    { id: '1', name: 'Alice Smith', status: 'online', avatar: null },
    { id: '2', name: 'Bob Johnson', status: 'offline', avatar: null },
    { id: '3', name: 'Carol Williams', status: 'online', avatar: null },
    { id: '4', name: 'David Brown', status: 'away', avatar: null },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 p-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contacts</h2>
      <div className="space-y-1">
        {contacts.map(contact => (
          <div
            key={contact.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {contact.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
              <p className={`text-sm capitalize ${
                contact.status === 'online' ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {contact.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
