export default function StoriesTab() {
  const stories = [
    { id: '1', user: 'Alice Smith', hasNew: true, preview: 'Just finished a great hike! 🏔️' },
    { id: '2', user: 'Bob Johnson', hasNew: true, preview: 'New project launch 🚀' },
    { id: '3', user: 'Carol Williams', hasNew: false, preview: 'Coffee time ☕' },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 p-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Stories</h2>
      <div className="space-y-3">
        {stories.map(story => (
          <div
            key={story.id}
            className={`p-4 rounded-xl border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
              story.hasNew
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                story.hasNew ? 'bg-gradient-to-br from-blue-500 to-purple-500' : 'bg-gray-400'
              }`}>
                {story.user.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{story.user}</p>
                {story.hasNew && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">New story</span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{story.preview}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
