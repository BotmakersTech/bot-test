'use client'

import React from 'react'
import { Link } from 'react-router-dom'

/* ---------- Types ---------- */

type SocialIconProps = {
  href: string
  children: React.ReactNode
}

/* ---------- Components ---------- */

const SocialIcon: React.FC<SocialIconProps> = ({ href, children }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={socialIconStyle}
      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
        const el = e.currentTarget
        el.style.backgroundColor = '#0a0a0a'
        el.style.transform = 'scale(1.1)'
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
        const el = e.currentTarget
        el.style.backgroundColor = '#fffff8'
        el.style.transform = 'none'
      }}
    >
      {children}
    </a>
  )
}

/* ---------- Footer ---------- */

const Footer: React.FC = () => {
  return (
    <footer style={footerStyle}>
      <div style={topContainer}>

        {/* Logo */}
        <div style={{ maxWidth: 250 }}>
          <img src="/logo/bot.png" alt="BotLeague" style={{ width: '100%' }} />
        </div>

        {/* Navigation */}
        <div style={navWrapper}>
          {[
            [
              { label: 'BotMakers', href: 'https://botmakerstech.in/' },
              { label: 'MakersNext', href: 'https://makersnext.in/' },
            ],
            [
              { label: 'BotShop', href: 'https://botshop.in/' },
              { label: 'Roboplayzone', href: 'https://roboplayzone.com/' },
            ],
          ].map((col, ci) => (
            <div key={ci} style={navColumn}>
              {col.map((l, i) => (
                <a key={i} href={l.href} style={navLink}>
                  {l.label}
                </a>
              ))}
            </div>
          ))}

          <div style={navColumn}>
            <Link to="/contact" style={navLink}>
              Contact Us
            </Link>
            <Link to="/about" style={navLink}>
              About Us
            </Link>
          </div>
        </div>

        {/* Social Icons */}
        <div style={socialWrapper}>
          <SocialIcon href="https://www.instagram.com/botleague/#">
            <svg viewBox="0 0 448 512" width="23" height="23" fill="#333">
              <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7z" />
            </svg>
          </SocialIcon>

          <SocialIcon href="https://api.whatsapp.com/send/?phone=917775969089">
            <svg viewBox="0 0 448 512" width="23" height="23" fill="#333">
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9" />
            </svg>
          </SocialIcon>

          <SocialIcon href="https://www.youtube.com/@botleague-w5g">
            <svg viewBox="0 0 576 512" width="23" height="23" fill="#333">
              <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64" />
            </svg>
          </SocialIcon>

          <SocialIcon href="mailto:contact@botleague.in">
            <svg viewBox="0 0 512 512" width="23" height="23" fill="#333">
              <path d="M48 64C21.5 64 0 85.5 0 112" />
            </svg>
          </SocialIcon>
        </div>
      </div>

      {/* Divider */}
      <div style={dividerStyle} />

      {/* Copyright */}
      <p style={copyrightStyle}>
        © 2026 BotLeague. All rights reserved.
      </p>
    </footer>
  )
}

export default Footer

/* ---------- Styles ---------- */

const footerStyle: React.CSSProperties = {
  backgroundColor: '#000',
  color: 'white',
  padding: '40px 20px 20px',
  fontFamily: "'Exo 2', sans-serif",
}

const topContainer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 30,
}

const navWrapper: React.CSSProperties = {
  display: 'flex',
  columnGap: 50,
  flexWrap: 'wrap',
  gap: 20,
}

const navColumn: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 15,
  fontWeight: 800,
}

const navLink: React.CSSProperties = {
  color: 'white',
  textDecoration: 'none',
}

const socialWrapper: React.CSSProperties = {
  display: 'flex',
  gap: 15,
  flexWrap: 'wrap',
  justifyContent: 'center',
}

const socialIconStyle: React.CSSProperties = {
  width: 50,
  height: 50,
  backgroundColor: '#fffff8',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#333',
  textDecoration: 'none',
  transition: 'all 0.3s ease',
}

const dividerStyle: React.CSSProperties = {
  margin: '15px auto',
  height: 3,
  backgroundColor: '#fff',
  width: '50%',
}

const copyrightStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '0.9rem',
  fontWeight: 700,
  margin: 0,
  padding: '10px 0',
}