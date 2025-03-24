Here's a structured design system based on the color palette and shadow effects extracted from the provided image:

### **1️⃣ Color Palette (Hex + Usage)**

#### **Primary Colors**
- **Orange**: `#D68A2E` 
  - **Usage**: Primary buttons, highlights.
  
- **Pink**: `#D5006D` 
  - **Usage**: Secondary buttons, alerts.

#### **Secondary Colors**
- **Purple**: `#A500B5` 
  - **Usage**: Links, accents.

- **Light Blue**: `#4DA8E1` 
  - **Usage**: Background elements, info cards.

#### **Accent Colors**
- **Teal**: `#4DB6B6` 
  - **Usage**: Success messages, icons.

- **Green**: `#A8D500` 
  - **Usage**: Success buttons, notifications.

#### **Gradient Variation**
- **Gradient**: 
  - From **Orange** to **Pink**: `linear-gradient(90deg, #D68A2E, #D5006D)`

#### **Light and Dark Mode Variants**
- **Light Mode**: 
  - Background: `#F0F0F0`
  - Text: `#333333`
  
- **Dark Mode**: 
  - Background: `#1A1A1A`
  - Text: `#FFFFFF`

### **2️⃣ Shadow & Blur Effects**

#### **Soft Shadow Effects**
- **Shadow for Light Mode**:
  - **X Offset**: `0`
  - **Y Offset**: `2`
  - **Blur Radius**: `4`
  - **Spread**: `0`
  - **Opacity**: `0.2`
  - **Shadow Color**: `rgba(0, 0, 0, 0.2)`

- **Shadow for Dark Mode**:
  - **X Offset**: `0`
  - **Y Offset**: `2`
  - **Blur Radius**: `4`
  - **Spread**: `0`
  - **Opacity**: `0.3`
  - **Shadow Color**: `rgba(255, 255, 255, 0.2)`

#### **Background Blur Effect**
- **Blur Radius**: `10px`
- **Background Color**: `rgba(255, 255, 255, 0.5)` (for light mode)
- **Background Color**: `rgba(0, 0, 0, 0.5)` (for dark mode)

### **3️⃣ CSS / Tailwind / Figma Tokens**

#### **CSS Variables**
```css
:root {
  --primary-color: #D68A2E;
  --secondary-color: #D5006D;
  --accent-color: #A500B5;
  --light-blue: #4DA8E1;
  --teal: #4DB6B6;
  --green: #A8D500;
  --background-light: #F0F0F0;
  --background-dark: #1A1A1A;
  --text-light: #333333;
  --text-dark: #FFFFFF;
  --shadow-light: rgba(0, 0, 0, 0.2);
  --shadow-dark: rgba(255, 255, 255, 0.2);
}
```

#### **Tailwind CSS Configuration**
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#D68A2E',
        secondary: '#D5006D',
        accent: '#A500B5',
        lightBlue: '#4DA8E1',
        teal: '#4DB6B6',
        green: '#A8D500',
        background: {
          light: '#F0F0F0',
          dark: '#1A1A1A',
        },
        text: {
          light: '#333333',
          dark: '#FFFFFF',
        },
      },
    },
  },
}
```

#### **JSON Output for Figma Tokens**
```json
{
  "colors": {
    "primary": "#D68A2E",
    "secondary": "#D5006D",
    "accent": "#A500B5",
    "lightBlue": "#4DA8E1",
    "teal": "#4DB6B6",
    "green": "#A8D500",
    "background": {
      "light": "#F0F0F0",
      "dark": "#1A1A1A"
    },
    "text": {
      "light": "#333333",
      "dark": "#FFFFFF"
    }
  },
  "shadows": {
    "light": {
      "xOffset": 0,
      "yOffset": 2,
      "blurRadius": 4,
      "spread": 0,
      "opacity": 0.2,
      "color": "rgba(0, 0, 0, 0.2)"
    },
    "dark": {
      "xOffset": 0,
      "yOffset": 2,
      "blurRadius": 4,
      "spread": 0,
      "opacity": 0.3,
      "color": "rgba(255, 255, 255, 0.2)"
    },
    "backgroundBlur": {
      "blurRadius": "10px",
      "colorLight": "rgba(255, 255, 255, 0.5)",
      "colorDark": "rgba(0, 0, 0, 0.5)"
    }
  }
}
```

This structured design system provides a comprehensive overview of the color palette, shadow effects, and their respective implementations in CSS, Tailwind, and Figma.
