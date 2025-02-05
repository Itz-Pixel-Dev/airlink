# Contributing to Airlink Panel

Thank you for your interest in contributing to Airlink Panel! This guide will help you understand our development process and standards.

## 🎨 UI/UX Guidelines

### Language System
- Language files must be JSON format in `/storage/lang/[language-code]/lang.json`
- Follow existing translation key structure
- Include all required translations
- Flag icons should be SVG format in `/public/assets/flags/`

### Theme System
- Follow Tailwind CSS class naming conventions
- Use CSS variables for theme colors
- Ensure smooth transitions between themes
- Test both light and dark modes

### Component Development
- Use EJS templating
- Follow existing component structure
- Include proper animations and transitions
- Ensure responsive design
- Test across different browsers

### Accessibility
- Include ARIA labels
- Support keyboard navigation
- Maintain proper color contrast
- Test with screen readers

## 💻 Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Set up your database
5. Run migrations: `npm run migrate:dev`
6. Start development server: `npm run dev`

## 🔍 Code Review Process

1. Create a feature branch
2. Follow code style guidelines
3. Write tests
4. Submit PR with clear description
5. Address review comments

## 📝 Commit Guidelines

- Use conventional commit messages
- Keep commits focused and atomic
- Reference issues in commits

## 🧪 Testing

- Write unit tests for new features
- Test UI components across devices
- Verify language translations
- Check theme transitions

## 📚 Documentation

- Update README.md for major changes
- Document new features
- Include code comments
- Update API documentation

## 🤝 Community

- Join our [Discord](https://discord.gg/D8YbT9rDqz)
- Follow our Code of Conduct
- Be respectful and constructive