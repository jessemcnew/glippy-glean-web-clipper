# Code Quality & Development Workflow

## Overview

This project uses modern code quality tools to ensure consistent, maintainable code:

- **Prettier** - Automatic code formatting
- **ESLint** - Code linting and error detection (configured, needs debugging)
- **Husky** - Git hooks for automated quality checks
- **lint-staged** - Run tools only on staged files

## Quick Start

### Available Scripts

```bash
# Format all files with Prettier
npm run format

# Check if files are properly formatted
npm run format:check

# Run ESLint (when working)
npm run lint

# Run ESLint with auto-fix (when working)
npm run lint:fix

# Run both linting and formatting (when ESLint is working)
npm run quality

# Check code quality without making changes
npm run quality:check
```

### Pre-commit Hooks

The project is configured with Husky pre-commit hooks that automatically:
- Format staged files with Prettier
- (Will run ESLint when configuration is fixed)

This ensures all committed code follows consistent formatting standards.

## 📁 Configuration Files

### Prettier (`.prettierrc`)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### ESLint (`eslint.config.mjs`)
- Chrome extension specific rules
- ES2022 module support
- Import/export validation
- JSDoc support (when working)

### Ignored Files (`.prettierignore`)
- `node_modules/`
- `dist/` and `build/`
- Package manager lock files
- Archive and backup files

## Development Workflow

### 1. Making Changes
```bash
# Make your code changes
# Files will be automatically formatted on commit
git add .
git commit -m "your commit message"
```

### 2. Manual Formatting
```bash
# Format all files manually
npm run format

# Check formatting without changing files
npm run format:check
```

### 3. Code Quality Checks
```bash
# Run all quality checks (when ESLint is working)
npm run quality:check
```

## Current Issues & Solutions

### ESLint Configuration
**Status**: Configured but needs debugging
**Issue**: ESLint v9+ flat config format compatibility
**Workaround**: Using Prettier for now, ESLint disabled in pre-commit

### Husky Pre-commit Hooks
**Status**: Working with Prettier only
**Issue**: Node.js version compatibility with some packages
**Solution**: Simplified to run only Prettier for now

## Best Practices

### Code Style
- Use single quotes for strings
- 2-space indentation
- Semicolons required
- 100 character line length
- Trailing commas in ES5 contexts

### Git Workflow
- All code is automatically formatted on commit
- Pre-commit hooks prevent inconsistent formatting
- Use descriptive commit messages

### Chrome Extension Specific
- ES modules with `.js` extensions
- Chrome extension APIs properly typed
- Service worker vs content script environments handled

## Future Improvements

1. **Fix ESLint Configuration**
   - Debug ESLint v9+ flat config
   - Add back to pre-commit hooks
   - Enable import/export validation

2. **Add Testing**
   - Jest for unit tests
   - Test coverage reporting
   - Pre-commit test running

3. **CI/CD Integration**
   - GitHub Actions for quality checks
   - Automated formatting verification
   - Build and test on pull requests

## Resources

- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [Husky Git Hooks](https://typicode.github.io/husky/)
- [lint-staged](https://github.com/okonet/lint-staged)