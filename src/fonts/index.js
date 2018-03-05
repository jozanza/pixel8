import pixel8Regular from './pixel8-regular-7.json'
import pixel8Mono from './pixel8-mono-7.json'

const fontList = [pixel8Regular, pixel8Mono]
const fonts = {}

for (const font of fontList) {
  fonts[font.info.face] = font
}

export default fonts
