'use client'

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'

/* ---------- Types ---------- */

type NavLinkItem = {
  label: string
  href: string
  external: boolean
}

type NavbarProps = {
  links?: NavLinkItem[]
}

/* ---------- Component ---------- */

const Navbar: React.FC<NavbarProps> = ({ links }) => {
  const [scrolled, setScrolled] = useState<boolean>(false)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const defaultLinks: NavLinkItem[] =
    links || [
      { label: 'Battle Of Robots', href: 'https://botleague.in/BattleOfRobots/', external: true },
      { label: 'Host', href: 'https://api.whatsapp.com/send/?phone=917775969089', external: true },
      { label: 'Contact Us', href: '/contact', external: false },
      { label: 'About Us', href: '/about', external: false },
    ]

  return (
    <>
      <nav style={{ ...navStyle, boxShadow: scrolled ? '0 10px 40px rgba(255,76,76,0.1)' : 'none' }}>
        <div style={navInner}>
          <Link to="/">
            <img src={logo} alt="BotLeague" style={logoStyle} />
          </Link>

          {/* Desktop */}
          <ul className="nav-desktop" style={desktopMenu}>
            {defaultLinks.map((link, i) => (
              <li key={i}>
                {link.external ? (
                  <a href={link.href} style={linkSt}>
                    {link.label}
                  </a>
                ) : (
                  <Link to={link.href} style={linkSt}>
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Hamburger */}
          <div
            className="hamburger"
            onClick={() => setMenuOpen((m) => !m)}
            style={hamburgerStyle}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  ...hamburgerLine,
                  transform: menuOpen
                    ? i === 0
                      ? 'rotate(45deg) translate(8px,8px)'
                      : i === 2
                      ? 'rotate(-45deg) translate(8px,-8px)'
                      : 'none'
                    : 'none',
                  opacity: menuOpen && i === 1 ? 0 : 1,
                }}
              />
            ))}
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <ul style={mobileMenu}>
            {defaultLinks.map((link, i) => (
              <li key={i}>
                {link.external ? (
                  <a
                    href={link.href}
                    style={{ ...linkSt, fontSize: '1.1rem' }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    to={link.href}
                    style={{ ...linkSt, fontSize: '1.1rem' }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </nav>

      <style>{`
        @media (max-width: 767px) {
          .nav-desktop {
            display: none !important;
          }
          .hamburger {
            display: flex !important;
          }
        }
      `}</style>
    </>
  )
}

export default Navbar

/* ---------- Styles ---------- */

const navStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  width: '100%',
  background: 'rgba(10,10,10,0.95)',
  backdropFilter: 'blur(20px)',
  zIndex: 1000,
  padding: '0 6%',
  borderBottom: '1px solid rgba(255,76,76,0.2)',
  transition: 'all 0.3s ease',
}

const navInner: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const logoStyle: React.CSSProperties = {
  height: 60,
  width: 'auto',
  cursor: 'pointer',
}

const desktopMenu: React.CSSProperties = {
  display: 'flex',
  gap: '2.5rem',
  listStyle: 'none',
  alignItems: 'center',
}

const hamburgerStyle: React.CSSProperties = {
  display: 'none',
  flexDirection: 'column',
  gap: 8,
  cursor: 'pointer',
  padding: 5,
}

const hamburgerLine: React.CSSProperties = {
  width: 25,
  height: 3,
  background: '#FF4C4C',
  borderRadius: 2,
  display: 'block',
  transition: 'all 0.3s ease',
}

const mobileMenu: React.CSSProperties = {
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  padding: '2rem',
  gap: '1.5rem',
  background: 'rgba(10,10,10,0.98)',
}

const linkSt: React.CSSProperties = {
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  transition: 'color 0.3s ease',
  fontFamily: "'Exo 2', sans-serif",
}