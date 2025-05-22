# CardGen Pro (2025 Edition)

**Created by [mat1520](https://github.com/mat1520)**
**Try the Page: https://credit-cart-gen-luhn.vercel.app**

---

## Overview

CardGen Pro is a modern, multi-page web application and Telegram bot for advanced card generation, BIN lookup, OSINT tools, and temporary email—all with a beautiful, animated UI and robust backend logic. Built for educational, pentesting, and cybersecurity research purposes.

- **Frontend:** Multipage, responsive, glassmorphism, animated backgrounds, and modern UX.
- **Backend:** Node.js, Express, and Telegram bot integration.
- **Telegram Bot:** Full-featured, with command history, favorites, temp mail, IP check, and more.
- **Year:** 2025

---

## Features

- **Card Generator:** Generate valid card numbers with Luhn algorithm, custom BIN, date, and CVV.
- **BIN Lookup:** Get detailed info about any BIN (bank, country, brand, type, level).
- **SRI Lookup:** Ecuadorian SRI lookup by ID (via Telegram bot).
- **Vehicle Plate Lookup:** Ecuadorian vehicle info by plate (via Telegram bot).
- **Temporary Email:** Generate and check temp mailboxes (web & Telegram).
- **IP Address Fraud Check:** Check IP info, proxy/VPN/hosting/Tor status, and risk level (web & Telegram).
- **Favorites & History:** Save favorite BINs, view recent queries, and manage your data.
- **Modern UI:** Glassmorphism, responsive design, animated gradients, and smooth transitions.
- **Multi-language Ready:** (Spanish/English structure, easily extendable)

---

## Telegram Bot Commands

| Command         | Description                                 | Example                        |
|----------------|---------------------------------------------|---------------------------------|
| /start, .start | Show welcome and main menu                   | /start                         |
| /help, .help   | Show help and all commands                   | /help                          |
| /gen, .gen     | Generate cards (BIN|MM|YYYY|CVV)             | /gen 477349002646|05|2027|123  |
| /bin, .bin     | BIN lookup (detailed info)                   | /bin 431940                    |
| /ip, .ip       | IP info & fraud risk check                   | /ip 8.8.8.8                    |
| /cedula, .cedula | SRI lookup by ID (Ecuador)                 | /cedula 17xxxxxxxx             |
| /placa, .placa | Vehicle info by plate (Ecuador)              | /placa PDF9627                 |
| /mail, .mail   | Generate temporary email                     | /mail                          |
| /check, .check | Check temp mail messages                     | /check                         |
| /favoritos, .favoritos | List favorite BINs                   | /favoritos                     |
| /agregarbin, .agregarbin | Add BIN to favorites               | /agregarbin 431940             |
| /eliminarbin, .eliminarbin | Remove BIN from favorites         | /eliminarbin 1                 |
| /historial, .historial | View recent history                  | /historial                     |
| /clear, .clear | Clean the chat                              | /clear                         |
| /limpiar, .limpiar | Clean the chat (alt)                     | /limpiar                       |
| /ayuda, .ayuda | Show help                                   | /ayuda                         |

---

## Web App Pages

- `/index.html` — Card Generator (main)
- `/bin-lookup.html` — BIN Lookup
- `/sri-lookup.html` — SRI Lookup (info)
- `/temp-mail.html` — Temporary Email
- `/ip-check.html` — IP Address Fraud Check

All pages feature:
- Animated backgrounds (CSS gradients, glassmorphism)
- Responsive layouts
- Consistent navigation (active page hidden in nav)
- Modern, accessible forms and feedback

---

## Animations & Visuals

- **Animated Gradient Spheres:** Dynamic background spheres for a cyber/modern look.
- **Glassmorphism Panels:** All main containers use glassmorphism for a futuristic, clean UI.
- **Button & Input Animations:** Smooth hover, focus, and click transitions.
- **Modal & Notification Animations:** Fade-in/out for modals and toast notifications.

---

## Architecture Diagram (ASCII)

```
+-------------------+         +-------------------+
|    Web Frontend   | <-----> |   Telegram Bot    |
| (Vite, HTML, CSS) |         | (Node.js, Telegraf)|
+-------------------+         +-------------------+
         |                             |
         | REST/API calls              |
         v                             v
+---------------------------------------------+
|                External APIs                |
|  (BIN lookup, ipwho.is, mail.tm, SRI, etc.) |
+---------------------------------------------+
```

---

## How to Use

1. **Web:** Deploy or run locally with Vite (`npm run dev`). Navigate to any page.
2. **Telegram:** Start the bot, use `/start` or any command. All commands work with `/` or `.` prefix.
3. **Favorites & History:** Managed per user (localStorage for web, JSON per user for bot).

---

## Credits

- **Project Lead & Developer:** [mat1520](https://github.com/mat1520)
- **Year:** 2025
- **License:** MIT

---

## Disclaimer

> This project is for educational and cybersecurity research purposes only. Use responsibly. The author is not responsible for misuse. 
