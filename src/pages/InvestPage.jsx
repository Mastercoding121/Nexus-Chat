import { ArrowRight, Briefcase, DollarSign, ShieldCheck, TrendingUp, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const plans = [
  {
    title: 'Starter',
    roi: '8%',
    description: 'A balanced daily plan for members exploring the investment machine.',
    highlight: 'Great for first-time investors'
  },
  {
    title: 'Growth',
    roi: '14%',
    description: 'A stronger plan designed for members who want predictable compounding.',
    highlight: 'Best value for active members'
  },
  {
    title: 'Premium',
    roi: '24%',
    description: 'A high-yield option for members seeking accelerated returns with stronger upside.',
    highlight: 'Optimized for serious growth'
  }
]

export default function InvestPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 shadow-lg shadow-blue-950/30 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-400 to-sky-300 text-lg font-semibold text-slate-950">
              N
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-blue-300">Nexus</p>
              <h1 className="text-base font-semibold">Investment machine</h1>
            </div>
          </div>
          <Link to="/" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">
            Back home
          </Link>
        </header>

        <section className="grid gap-6 rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-blue-950/25 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200">
              <TrendingUp className="h-4 w-4" /> ROI platform
            </div>
            <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
              Smart investing designed for steady growth.
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-300">
              Explore balanced investment plans with transparent ROI, performance tracking, and a secure member experience.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">
                Join now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                Member login
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-slate-900 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3"><Briefcase className="h-6 w-6 text-blue-300" /></div>
              <div>
                <p className="text-sm text-slate-300">Projected monthly ROI</p>
                <p className="text-3xl font-semibold">+18.4%</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-300" /> Automation</span>
                <span className="font-semibold text-white">Live</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Protection</span>
                <span className="font-semibold text-white">Secure</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-cyan-300" /> Growth</span>
                <span className="font-semibold text-white">Compounded</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.title} className="rounded-[24px] border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-blue-950/20 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.3em] text-blue-300">{plan.title}</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-semibold text-white">{plan.roi}</span>
                <span className="pb-1 text-slate-400">ROI</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{plan.description}</p>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">{plan.highlight}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
