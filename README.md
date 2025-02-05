> [!CAUTION]
> AirLink is in development for a while and is getting used by a few people, please wait an release version

# Airlink Panel 🚀

**Streamlined Game Server Management**

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  
[![License](https://img.shields.io/github/license/AirlinkLabs/panel)](https://github.com/AirlinkLabs/panel/blob/main/LICENSE)
[![Discord](https://img.shields.io/discord/1302020587316707420)](https://discord.gg/D8YbT9rDqz)

## 📖 Overview

Airlink Panel is an advanced, open-source game server management platform designed to simplify server deployment, monitoring, and administration. With a modern, responsive UI and extensive customization options, it provides an exceptional user experience for server management.

### ✨ Features

- **Multi-Language Support**: 
  - Support for English, Spanish, French, and German
  - Easy language switching with animated flag icons
  - Persistent language preferences

- **Theme System**:
  - Light and dark theme support
  - System theme detection
  - Smooth transitions between themes
  - Persistent theme preferences

- **Enhanced Search**:
  - Real-time search with debouncing
  - Keyboard navigation support
  - Rich search results with icons and breadcrumbs
  - Smooth animations and loading states

- **Modern UI/UX**:
  - Responsive design for all devices
  - Smooth animations and transitions
  - Glassmorphism effects
  - Intuitive navigation

## 🛠 Prerequisites

- Node.js (v16+)
- npm (v8+)
- Git
- Supported Database (PostgreSQL/MySQL)

## 💾 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AirlinkLabs/panel.git
   cd panel
   ```

2. Create and configure your environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the .env file with your database and other configuration settings.

3. Install dependencies:
   ```bash
   npm install
   ```

4. Configure the Prisma database and run migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. Build the application:
   ```bash
   npm run build-ts
   ```

6. Run the application:
   ```bash
   # For development
   npm run dev
   
   # For production
   npm run start
   ```

## Running with pm2 (Optional)

1. Install pm2:
   ```bash
   npm install pm2 -g
   ```

2. Start the application using pm2:
   ```bash
   pm2 start dist/app.js --name "panel"
   ```

3. Set up pm2 to auto-start on server reboot:
   ```bash
   pm2 save
   pm2 startup
   ```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow TypeScript best practices
- Write unit tests for new features
- Maintain clean, readable code
- Update documentation

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🎨 Customization

### Language Configuration
The panel supports multiple languages out of the box. To add a new language:

1. Create a new language file in `src/locales/[language-code].json`
2. Add the language option to the language switcher component
3. Add the corresponding flag icon in `public/flags/`

### Theme Customization
Modify the theme colors and styles in:
- `tailwind.config.js` for Tailwind configuration
- `src/styles/globals.css` for global CSS variables and theme settings

## 🔧 Development

[Previous development sections remain the same...]

<div align="center">
  Made with ❤️ by SSI
</div>
