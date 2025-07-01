# CardGen Pro BOT

![CardGen Pro BOT Logo](https://raw.githubusercontent.com/mat1520/Credit-Cart-Gen-Luhn/main/telegram-bot/OFFICIALT.png)

## 🧪 What is CardGen Pro BOT?
CardGen Pro BOT is a virtual lab for card generation, BIN analysis, and OSINT tools, designed for cybersecurity enthusiasts, pentesters, and developers. Generate valid cards, analyze BINs, manage favorites, and automate antifraud testing—all from Telegram, with a modern visual menu and flexible commands.

---

## 📚 Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Technical Details](#technical-details)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [Credits](#credits)
- [License](#license)

---

## 🚀 Features
- **Card Generation:** Instantly generate valid cards with custom BIN, date, and CVV.
- **BIN Lookup:** Get real-time info (bank, country, type, level) for any BIN.
- **OSINT Tools:** Query Ecuadorian ID (cédula) and vehicle plate data.
- **Favorites:** Save, list, and remove your favorite BINs for quick access.
- **History:** Review your recent generations and lookups.
- **Flexible Input:** All commands accept BINs with or without x, spaces, |, and various date/CVV formats.
- **Visual Menu:** Interactive start menu with buttons for Tools, Creator, Donate, and GitHub.
- **Fast & Secure:** Rate-limited, with local user data storage.
- **Open Source:** Actively maintained and open for contributions.

---

## ⚙️ Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/mat1520/Credit-Cart-Gen-Luhn.git
   cd Credit-Cart-Gen-Luhn/telegram-bot
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Telegram bot token:
   ```
   BOT_TOKEN=8199482062:AAE-odWminDhOpI-2HyAVWtH53s6PJFNCto
   ```
4. Start the bot:
   ```bash
   node index.js
   ```

---

## 🔧 Configuration
- **Environment:** Node.js 14+
- **Bot Token:** Required in `.env` as `BOT_TOKEN`
- **Local Data:** User data is stored in `data/` as JSON files

---

## 📝 Usage
All commands work with `/` or `.` prefix (e.g., `/gen` or `.gen`). Input is flexible!

- `/gen BIN|MM|YYYY|CVV` — Generate 10 cards (flexible input)
- `/bin BIN` — Lookup BIN info
- `/cedula <number>` — Query Ecuadorian ID info
- `/placa <plate>` — Query vehicle info
- `/favoritos` — List your favorite BINs
- `/agregarbin BIN [MM] [YYYY] [CVV]` — Add a BIN to favorites (flexible input)
- `/eliminarbin <index|BIN>` — Remove a BIN by index or flexible BIN
- `/historial` — View your recent activity
- `/clear` — Clean the chat
- `/start` — Show the visual menu

---

## 🛠 Technical Details
- **Structure:**
  - `index.js`: Main bot logic
  - `utils.js`: Card generation, validation, and helpers
  - `data/`: User data storage
- **Flexible Input Parser:**
  - Accepts BINs with or without x, spaces, |, and various date/CVV formats
  - Used in `/gen`, `/agregarbin`, `/eliminarbin` for a seamless experience
- **APIs Used:**
  - BIN info: binlist.net, bintable.com
  - Ecuadorian ID & plate: SRI APIs
- **Visual Menu:**
  - On `/start`, sends a hacker-style image, warning, and dynamic keyboard

---

## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change or improve.

---

## 🗺️ Roadmap
- [ ] Inline buttons for quick actions
- [ ] Multi-language support
- [ ] More OSINT tools
- [ ] Web dashboard for stats
- [ ] Cloud data storage option

---

## 🙏 Credits
- Created by [@MAT3810](https://t.me/MAT3810)
- GitHub: [mat1520](https://github.com/mat1520)
- Donate: [PayPal](https://paypal.me/ArielMelo200?country.x=EC&locale.x=es_XC)

---

## ⚡️ Warning
> This bot is for educational and cybersecurity testing purposes only. Misuse of the generated information may have legal consequences. Use at your own risk!

---

## 🛡️ License
MIT 