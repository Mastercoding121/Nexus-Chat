import Avatar from './Avatar'

// Mock data
const mockStories = [
  {
    id: '1',
    user_name: 'Alice Smith',
    user_avatar: null,
    media_type: 'image',
    viewed: false
  },
  {
    id: '2',
    user_name: 'Bob Johnson',
    user_avatar: null,
    media_type: 'video',
    viewed: true
  },
  {
    id: '3',
    user_name: 'Charlie Brown',
    user_avatar: null,
    media_type: 'text',
    viewed: false
  }
]

export default function StoryBar() {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 p-4">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {/* Your Story */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <Avatar alt="You" size="lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white dark:border-gray-900">
              +
            </div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Your Story</span>
        </div>

        {/* Other Stories */}
        {mockStories.map(story => (
          <div key={story.id} className="flex flex-col items-center gap-1">
            <div className={`p-0.5 rounded-full ${story.viewed ? 'bg-gray-300 dark:bg-gray-700' : 'bg-gradient-to-tr from-yellow-400 to-pink-600'}`}>
              <Avatar src={story.user_avatar} alt={story.user_name} size="lg" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate w-16 text-center">
              {story.user_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
