import React from 'react'
import { Text } from '@tarojs/components'
import './index.scss'

export type IconName =
  | 'leaf' | 'flower2' | 'camera' | 'image' | 'refresh-cw'
  | 'map-pin' | 'droplet' | 'sun' | 'lightbulb' | 'check'
  | 'arrow-left' | 'chevron-right' | 'stethoscope' | 'sparkles'
  | 'bell' | 'message-circle' | 'clock' | 'edit-2' | 'x'
  | 'user' | 'book-open' | 'search' | 'trending-up' | 'grid'
  | 'tag' | 'star' | 'cloud-rain' | 'thermometer' | 'alert-triangle'
  | 'file-text' | 'info' | 'shopping-cart' | 'heart' | 'clipboard'
  | 'help-circle' | 'flower' | 'mail' | 'lock' | 'eye-off'
  | 'eye' | 'shield' | 'bug' | 'check-circle' | 'loader'
  | 'moon' | 'cloud' | 'wind' | 'calendar' | 'trash'
  | 'scissors' | 'bell-off' | 'send' | 'sprout' | 'package'
  | 'trophy' | 'flask-conical' | 'plus' | 'minus' | 'home'
  | 'circle-check' | 'circle-x' | 'chevron-down' | 'filter'
  | 'settings' | 'log-out' | 'share-2' | 'download'

interface IconProps {
  name: IconName
  size?: number
  color?: string
  fill?: string
  className?: string
  style?: React.CSSProperties
}

// Unicode icons for WeChat mini-program - matched to lucide icon styles
const iconUnicode: Record<IconName, string> = {
  'leaf': '\u2618',                 // ☘ shamrock (similar to leaf)
  'flower2': '\u2736',               // ✶ six-pointed star (floral feel)
  'camera': '\u{1F4F7}',             // 📷 camera
  'image': '\u{1F5BC}',              // 🖼️ picture frame
  'refresh-cw': '\u{1F504}',         // 🔄 clockwise arrows
  'map-pin': '\u{1F4CD}',            // 📍 pin
  'droplet': '\u{1F4A7}',            // 💧 droplet
  'sun': '\u{1F50E}',                // 🔎 magnifying glass (search/sun similar)
  'lightbulb': '\u{1F4A1}',          // 💡 bulb
  'check': '\u2713',                 // ✓ checkmark
  'arrow-left': '\u2190',            // ← left arrow
  'chevron-right': '\u203A',         // › right chevron
  'stethoscope': '\u{1FA7A}',        // 🩺 stethoscope
  'sparkles': '\u2728',              // ✨ sparkles
  'bell': '\u{1F514}',               // 🔔 bell
  'message-circle': '\u{1F4AC}',     // 💬 speech bubble
  'clock': '\u{1F551}',              // 🕐 clock
  'edit-2': '\u270E',                // ✎ pencil
  'x': '\u2715',                     // ✕ cross
  'user': '\u{1F464}',               // 👤 person
  'book-open': '\u{1F4D6}',           // 📖 open book
  'search': '\u{1F50D}',             // 🔍 magnifier
  'trending-up': '\u{1F4C8}',        // 📈 chart up
  'grid': '\u{1F4CB}',               // 📋 clipboard
  'tag': '\u{1F3F7}',                // 🏷️ label
  'star': '\u2605',                  // ★ filled star
  'cloud-rain': '\u{1F327}',         // 🌧️ cloud rain
  'thermometer': '\u{1F321}',        // 🌡️ thermometer
  'alert-triangle': '\u26A0',        // ⚠️ warning
  'file-text': '\u{1F4C4}',          // 📄 document
  'info': '\u2139',                  // ℹ️ info
  'shopping-cart': '\u{1F6D2}',      // 🛒 cart
  'heart': '\u2665',                 // ♥ heart
  'clipboard': '\u{1F4CB}',          // 📋 clipboard
  'help-circle': '\u2753',           // ❓ question
  'flower': '\u273F',                // ✿ floral
  'mail': '\u2709',                  // ✉️ envelope
  'lock': '\u{1F512}',               // 🔒 lock
  'eye-off': '\u{1F648}',            // 🙈 see no evil
  'eye': '\u{1F441}',                // 👁️ eye
  'shield': '\u{1F6E1}',             // 🛡️ shield
  'bug': '\u{1F41B}',                // 🐛 bug
  'check-circle': '\u2705',         // ✅ circle check
  'loader': '\u{1F550}',             // 🕐 clock (loader alternative)
  'moon': '\u{1F319}',               // 🌙 moon
  'cloud': '\u2601',                 // ☁️ cloud
  'wind': '\u{1F4A8}',               // 💨 wind
  'calendar': '\u{1F4C5}',           // 📅 calendar
  'trash': '\u{1F5D1}',              // 🗑️ wastebasket
  'scissors': '\u2702',              // ✂ scissors
  'bell-off': '\u{1F515}',           // 🔕 bell off
  'send': '\u27A1',                  // ➡️ right arrow
  'sprout': '\u{1F331}',              // 🌱 sprout
  'package': '\u{1F4E6}',            // 📦 package
  'trophy': '\u{1F3C6}',             // 🏆 trophy
  'flask-conical': '\u{1F9EA}',     // 🧪 flask
  'plus': '\u271A',                  // ✚ plus (cleaner)
  'minus': '\u2212',                 // − minus
  'home': '\u2302',                  // ⌂ house
  'circle-check': '\u2714',          // ✔ circle check
  'circle-x': '\u2716',              // ✖ circle x
  'chevron-down': '\u2193',          // ↓ down chevron
  'filter': '\u25A1',                // □ filter (square)
  'settings': '\u2699',              // ⚙ gear
  'log-out': '\u{1F6AA}',            // 🚪 door
  'share-2': '\u{1F4E4}',            // 📤 out tray
  'download': '\u{1F4E5}',           // 📥 in tray
}

const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = '#333',
  fill,
  className = '',
  style
}) => {
  const unicode = iconUnicode[name]
  if (!unicode) return null

  return (
    <Text
      className={`icon-component ${className}`}
      style={{
        fontSize: `${size}px`,
        color: color,
        lineHeight: `${size}px`,
        textAlign: 'center',
        ...style
      }}
    >
      {unicode}
    </Text>
  )
}

export default Icon
