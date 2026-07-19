import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChatBubbleLeftIcon, UserGroupIcon, PlusIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/solid'
import Avatar from './Avatar'
import { createChat, getChats, getContacts, addContact, deleteContact, formatNexusId } from '../../lib/persistence'

export default function ContactsPanel() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactNexusId, setNewContactNexusId] = useState('')

  useEffect(() => {
    const loadContacts = async () => {
      const data = await getContacts()
      setContacts(data)
    }
    loadContacts()

    const handleUpdate = () => loadContacts()
    window.addEventListener('nexus-contacts:updated', handleUpdate)
    return () => window.removeEventListener('nexus-contacts:updated', handleUpdate)
  }, [])

  const handleStartChat = async (contact) => {
    const chats = await getChats()
    const existing = chats.find(c => c.title === contact.name)
    if (existing) {
      navigate(`/app/chat/${existing.id}`)
    } else {
      const newChat = await createChat({
        title: contact.name,
        type: 'private',
        avatar_url: null,
      })
      navigate(`/app/chat/${newChat.id}`)
    }
  }

  const handleAddContact = async (e) => {
    e.preventDefault()
    if (!newContactName.trim() || !newContactNexusId.trim()) return

    await addContact({
      name: newContactName.trim(),
      nexusId: formatNexusId(newContactNexusId),
    })
    setNewContactName('')
    setNewContactNexusId('')
    setShowAddModal(false)
  }

  const handleDeleteContact = async (contactId) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await deleteContact(contactId)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border bg-card shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UserGroupIcon className="w-7 h-7 text-primary" />
              Contacts
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Your existing secure contacts on Nexus Network</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition duration-200"
          >
            <PlusIcon className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <UserGroupIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium text-center">No contacts yet</p>
            <p className="text-sm text-muted-foreground mt-1 text-center">Add contacts to start messaging</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map(contact => (
              <div 
                key={contact.id} 
                className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition duration-200"
              >
                <div className="flex items-center gap-4">
                  <Avatar src={contact.avatarUrl} alt={contact.name} size="md" />
                  <div>
                    <h3 className="font-bold text-foreground leading-tight">{contact.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">ID: {contact.nexusId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartChat(contact)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition duration-200"
                  >
                    <ChatBubbleLeftIcon className="w-4 h-4" />
                    Chat
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition duration-200"
                    title="Delete Contact"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0 cursor-default" 
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-border z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-card">
              <h3 className="font-bold text-foreground text-lg">Add New Contact</h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-2 hover:bg-muted rounded-full transition"
              >
                <XMarkIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleAddContact} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Enter contact name"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nexus ID</label>
                <input
                  type="text"
                  value={newContactNexusId}
                  onChange={(e) => setNewContactNexusId(e.target.value)}
                  placeholder="10-XXXX-XXXX"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Enter the 10-digit Nexus ID (e.g., 1012345678)</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition duration-200"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
