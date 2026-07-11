import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../components/AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      // TODO: Implement password reset email logic
      setMessage('Password reset email sent! Check your inbox.')
      setEmail('')
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter the email connected to your account and we’ll guide you through the reset flow." compact>
      <div className="mx-auto w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          {message && <p className="text-center text-sm text-green-500">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Log in
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
