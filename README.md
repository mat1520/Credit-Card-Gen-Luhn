# 💳 CardGen Pro - Advanced Credit Card Generator

[![MIT License](https://img.shields.io/badge/License-MIT-a252ff.svg?style=for-the-badge)](https://choosealicense.com/licenses/mit/)
[![Version](https://img.shields.io/badge/version-2.0.0-a252ff.svg?style=for-the-badge)](https://github.com/yourusername/cardgen-pro)
[![Deployment](https://img.shields.io/badge/deployment-vercel-black.svg?style=for-the-badge)](https://vercel.com)

<div align="center">
  <h3>🌟 Professional Credit Card Generator with Luhn Algorithm 🌟</h3>
  <p>Generate valid test credit card numbers for development and testing purposes.</p>
</div>

## 🎯 Features

| Feature | Description |
|---------|------------|
| 🚀 Fast Generation | Generate thousands of valid cards instantly |
| 🔍 BIN Validation | Real-time BIN verification and information |
| 📤 Multiple Exports | Support for TXT, CSV, JSON, XML, SQL formats |
| 🎨 Modern UI | Dark theme with responsive design |
| ⚡ High Performance | Client-side processing with no dependencies |

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/cardgen-pro.git

# Navigate to project directory
cd cardgen-pro

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📁 Project Structure

```
cardgen-pro/
├── src/
│   ├── js/
│   │   ├── app.js
│   │   └── utils/
│   ├── styles/
│   │   └── styles.css
│   └── assets/
├── public/
│   └── index.html
├── package.json
├── vercel.json
└── README.md
```

## 💻 Technical Details

### Card Generation Process
```mermaid
graph LR
    A[Input BIN] -->|Validation| B[Luhn Algorithm]
    B -->|Generation| C[Valid Numbers]
    C -->|Export| D[Multiple Formats]
```

### Supported Card Types

| Brand | BIN Range | Length |
|-------|-----------|---------|
| Visa | 4xxxxx | 16 |
| Mastercard | 51-55xxxx | 16 |
| Amex | 34xxxx, 37xxxx | 15 |
| Discover | 6011xx, 644-649 | 16 |

## 🛠️ Development

```javascript
// Example card generation
const card = CardGen.generate('453810');

// Bulk generation
const cards = CardGen.generateBatch({
    bin: '453810',
    quantity: 1000,
    format: 'json'
});
```

## 📦 Deployment

This project is configured for automatic deployment on Vercel:

1. Push your changes to GitHub:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

2. Vercel will automatically:
   - Detect the project configuration
   - Install dependencies
   - Build the project
   - Deploy to production

## ⚙️ Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## 🔐 Security

- ✅ Client-side processing only
- ✅ No data storage
- ✅ Test numbers only
- ✅ Secure export methods

## 📈 Performance

```
Generation Speed ⚡
├── Single Card: ~5ms
├── Bulk (100 cards): ~100ms
└── Export (1000 cards): ~200ms
```

## 🌐 Browser Support

| Browser | Support |
|---------|----------|
| Chrome | ✅ |
| Firefox | ✅ |
| Safari | ✅ |
| Edge | ✅ |
| Opera | ✅ |

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  
**[Documentation](https://github.com/yourusername/cardgen-pro/wiki)** • **[Report Bug](https://github.com/yourusername/cardgen-pro/issues)** • **[Request Feature](https://github.com/yourusername/cardgen-pro/issues)**

Made with 💜 by the CardGen Pro Team

</div> 