# FlatMagic Changelog

## Version 1.2.0 (December 29, 2023)

### 🔧 Technical Improvements
- **Enhanced SVG Handling**
  - Fixed SVG conversion by replacing TextDecoder with String.fromCharCode
  - Implemented proper flattening using Figma's native flatten function
  - Added better error handling for SVG conversion process

### 🎨 UI Improvements
- **Better User Experience**
  - Added real-time button state management
  - Flatten button now disables automatically when no frame is selected
  - Added visual feedback for selection state

### 🏗 Infrastructure
- Improved development workflow with comprehensive .gitignore
- Added proper version management in manifest.json
- Enhanced code organization and maintainability

## Version 1.1.0 (December 13, 2023)

### 🎨 UI Enhancements
- **New Glass Morphism Design**: Implemented a modern frosted glass effect throughout the interface
  - Added backdrop blur effects for a premium look and feel
  - Created subtle transparency gradients for depth
  - Enhanced visual hierarchy with refined shadows and borders

### ⚡️ Performance Improvements
- **Adaptive Image Scaling**
  - 4x scale for frames under 1000x1000 pixels
  - 2x scale for frames between 1000x1000 and 1500x1500 pixels
  - 1x scale for frames larger than 1500x1500 pixels
- Added retry mechanism for more reliable image exports

### ✨ New Features
- **Original Frame Retention**
  - Added option to keep or remove the original frame after flattening
  - Implemented smart frame cloning when retention is enabled

### 🔧 Technical Improvements
- Enhanced error handling for large frame exports
- Optimized UI rendering performance
- Improved overall plugin stability

### 💅 Style Updates
- Refined container styling with darker, more visually appealing backgrounds
- Enhanced contrast for better readability
- Added smooth transitions for interactive elements
- Improved spacing and layout consistency

---

*FlatMagic - Making frame flattening magical! 🪄*
