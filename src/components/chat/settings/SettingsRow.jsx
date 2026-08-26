export default function SettingsRow({ label, children }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
      <span className="text-gray-900 dark:text-white">{label}</span>
      {children}
    </div>
  )
}
