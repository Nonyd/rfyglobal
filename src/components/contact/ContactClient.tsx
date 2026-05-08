'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Instagram, Youtube, Twitter, MapPin, Send } from 'lucide-react'
import toast from 'react-hot-toast'

interface ContactClientProps {
  content: Record<string, string>
}

export function ContactClient({ content }: ContactClientProps) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#F8F8F8',
    padding: '14px 16px',
    fontSize: '14px',
    fontFamily: 'General Sans, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: '#A0A0A0',
    marginBottom: '8px',
    fontFamily: 'General Sans, sans-serif',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to send message')
      setSubmitted(true)
    } catch {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const socialLinks = [
    {
      icon: <Instagram size={18} />,
      label: 'Instagram',
      href: content['contact.instagram'] || 'https://instagram.com/rfyglobal',
      handle: '@rfyglobal',
    },
    {
      icon: <Youtube size={18} />,
      label: 'YouTube',
      href: content['contact.youtube'] || 'https://youtube.com/@yadah',
      handle: 'Yadah',
    },
    {
      icon: <Twitter size={18} />,
      label: 'X (Twitter)',
      href: content['contact.twitter'] || 'https://x.com/rfyglobal',
      handle: '@rfyglobal',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="mb-16">
        <p className="label-text mb-4">Get In Touch</p>
        <h1 className="font-display text-snow font-bold mb-4" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
          {content['contact.heading'] || 'We would love\nto hear from you.'}
        </h1>
        <div className="gold-line-left w-12 mb-6 opacity-50" />
        <p className="font-body text-mist max-w-lg leading-relaxed">
          {content['contact.subheading'] || 'Reach out with questions, partnership enquiries, or just to say hello. We read every message.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
        <div className="lg:col-span-3">
          {submitted ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="py-16 text-center">
              <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mb-6" style={{ borderColor: '#C9A84C' }}>
                <Send size={20} className="text-gold" />
              </div>
              <div className="gold-line max-w-[60px] mx-auto mb-6 opacity-30" />
              <h2 className="font-display text-snow text-3xl font-bold mb-3">Message sent.</h2>
              <p className="font-body text-mist">We received your message and will get back to you soon.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    required
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#C9A84C')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#C9A84C')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Subject *</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="What is this about?"
                  required
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#C9A84C')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
              </div>

              <div>
                <label style={labelStyle}>Message *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Write your message here..."
                  required
                  rows={7}
                  style={{ ...inputStyle, resize: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = '#C9A84C')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
                <p className="font-body text-xs mt-1 text-right" style={{ color: form.message.length > 2700 ? '#F87171' : '#585858' }}>
                  {form.message.length}/3000
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 font-body font-semibold text-xs tracking-widest uppercase transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: '#C9A84C', color: '#0F0F0F' }}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(0,0,0,0.3)', borderTopColor: 'transparent' }} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-2 space-y-10">
          {content['contact.email'] && (
            <div>
              <p className="label-text mb-3">Email</p>
              <a href={`mailto:${content['contact.email']}`} className="font-body text-mist hover:text-gold transition-colors">
                {content['contact.email']}
              </a>
            </div>
          )}

          {content['contact.address'] && (
            <div>
              <p className="label-text mb-3">Location</p>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-gold shrink-0 mt-0.5" />
                <p className="font-body text-mist text-sm leading-relaxed">{content['contact.address']}</p>
              </div>
            </div>
          )}

          <div>
            <p className="label-text mb-4">Find Us</p>
            <div className="space-y-3">
              {socialLinks.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group transition-all">
                  <div
                    className="w-9 h-9 flex items-center justify-center border transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#585858' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#C9A84C'
                      e.currentTarget.style.color = '#C9A84C'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                      e.currentTarget.style.color = '#585858'
                    }}
                  >
                    {link.icon}
                  </div>
                  <div>
                    <p className="font-body text-xs text-fog">{link.label}</p>
                    <p className="font-body text-sm text-mist group-hover:text-gold transition-colors">{link.handle}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="border-l-2 pl-4" style={{ borderColor: 'rgba(201,168,76,0.4)' }}>
            <p className="font-body text-xs leading-relaxed" style={{ color: '#585858' }}>
              We typically respond within 24-48 hours. For urgent prayer needs, visit our{' '}
              <a href="/prayer" className="text-gold hover:opacity-70 transition-opacity">
                Prayer Wall
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
