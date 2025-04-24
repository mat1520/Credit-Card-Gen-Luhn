# 💳 CardGen Pro - Credit Card Generator

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black.svg)](https://credit-cart-gen-luhn.vercel.app)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
[![GitHub stars](https://img.shields.io/github/stars/mat1520/Credit-Cart-Gen-Luhn?style=social)](https://github.com/mat1520/Credit-Cart-Gen-Luhn/stargazers)

[Live Demo](https://credit-cart-gen-luhn.vercel.app) | [Documentation](#-documentation) | [Features](#-features) | [Installation](#%EF%B8%8F-installation)

![CardGen Pro Preview](./public/preview.png)

</div>

## 🌟 Overview

CardGen Pro is a state-of-the-art credit card number generator that implements the Luhn algorithm for creating valid test credit card numbers. Perfect for developers, QA teams, and testing environments.

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| 🔢 Smart Generation | Generates valid credit card numbers using the Luhn algorithm |
| 🎨 Modern UI | Clean, responsive interface with dark/light theme support |
| 📊 Bulk Generation | Generate multiple card numbers in one click |
| 📋 Export Options | Export to TXT/CSV formats with one click |
| 🔄 Custom BIN Support | Use any BIN length for generation |
| 📅 Dynamic Expiry | Automatic or custom expiry date generation |
| 🔒 Secure | All processing done client-side |

## 🔍 How It Works

```mermaid
graph LR
    A[Input BIN] --> B[Generate Numbers]
    B --> C[Luhn Validation]
    C --> D[Format Output]
    D --> E[Export Results]
```

### Luhn Algorithm Implementation

```javascript
function luhnCheck(number) {
    let sum = 0;
    let isEven = false;
    
    // Loop through values starting from the rightmost digit
    for (let i = number.length - 1; i >= 0; i--) {
        let digit = parseInt(number.charAt(i), 10);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return (sum % 10) === 0;
}
```

## 📊 Card Number Format

| Section | Length | Description |
|---------|--------|-------------|
| BIN | 6-8 digits | Bank Identification Number |
| Account | Variable | Account identifier |
| Check Digit | 1 digit | Luhn algorithm check digit |

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/mat1520/Credit-Cart-Gen-Luhn.git
cd Credit-Cart-Gen-Luhn
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

## 🚀 Deployment

The project is live on Vercel: [CardGen Pro](https://credit-cart-gen-luhn.vercel.app)

### Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fmat1520%2FCredit-Cart-Gen-Luhn)

1. Fork this repository
2. Sign up on [Vercel](https://vercel.com)
3. Import your fork
4. Deploy!

## 💻 Usage Examples

### Basic Generation
```javascript
// Generate a single card number
const card = await generateCard();
// Output: 4532789445218796
```

### Bulk Generation
```javascript
// Generate multiple cards
const cards = await generateBulk(10);
// Output: Array of 10 valid card numbers
```

## 📱 Responsive Design

| Device | Screenshot |
|--------|------------|
| Desktop | ![Desktop View](./public/desktop.png) |
| Mobile | ![Mobile View](./public/mobile.png) |
| Tablet | ![Tablet View](./public/tablet.png) |

## 🔐 Security Features

- ✅ Client-side processing only
- ✅ No data storage
- ✅ Test numbers only
- ✅ Secure export options

## 🎨 Themes

| Theme | Preview |
|-------|---------|
| Light | ![Light Theme](./public/light.png) |
| Dark | ![Dark Theme](./public/dark.png) |

## 📈 Performance

| Operation | Time (ms) |
|-----------|-----------|
| Single Generation | ~5ms |
| Bulk Generation (100) | ~150ms |
| Export (1000 cards) | ~300ms |

## 🌐 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 13+ |
| Edge | 80+ |

## 🛣️ Roadmap

- [ ] API Integration
- [ ] Custom BIN Database
- [ ] Advanced Validation Rules
- [ ] Multiple Export Formats
- [ ] Batch Processing
- [ ] Custom Templates

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**mat1520**

* 🌐 Website: [CardGen Pro](https://credit-cart-gen-luhn.vercel.app)
* 💻 GitHub: [@mat1520](https://github.com/mat1520)

## ⭐️ Support

If you find this project useful, please consider giving it a star ⭐️

## 📊 Project Stats

![GitHub contributors](https://img.shields.io/github/contributors/mat1520/Credit-Cart-Gen-Luhn)
![GitHub last commit](https://img.shields.io/github/last-commit/mat1520/Credit-Cart-Gen-Luhn)
![GitHub issues](https://img.shields.io/github/issues/mat1520/Credit-Cart-Gen-Luhn)
![GitHub pull requests](https://img.shields.io/github/issues-pr/mat1520/Credit-Cart-Gen-Luhn) 