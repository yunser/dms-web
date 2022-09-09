import { darkStyle } from './dark'
import { lightStyle } from './light'
// 
// console.log('darkStyle', darkStyle)

const html = document.querySelector('html')
console.log('html', html)
// 调用方法
const handleSkin = (theme: string) => {
    console.log('html.classList', html.classList)
    html.classList.remove('theme-dark')
    html.classList.remove('theme-light')
    html.classList.add(`theme-${theme}`)
    if (theme == 'light') {
      // 明亮主题
        addSkin(lightStyle)
    } else {
      // 暗色主题
     addSkin(darkStyle)
    }
  }
// 添加皮肤的方法
function addSkin(content: string) {
  let head = document.getElementsByTagName("head")[0];
  const getStyle = head.getElementsByTagName('style');
  // 查找style是否存在，存在的话需要删除dom
  if (getStyle.length > 0) {
    for (let i = 0, l = getStyle.length; i < l; i++) {
        // console.log('getStyle[i]', getStyle[i])
      if (getStyle[i] && getStyle[i].getAttribute('data-type') === 'theme') {
        getStyle[i].remove();
      }
    }
  }
  // 最后加入对应的主题和加载less的js文件
  let styleDom = document.createElement("style");
  styleDom.dataset.type = "theme";
  styleDom.innerHTML = content;
  head.appendChild(styleDom);
}


let g_theme = localStorage.getItem('__theme') || 'light'

handleSkin(g_theme)

export function toggleTheme() {
    g_theme = g_theme == 'light' ? 'dark' : 'light'
    localStorage.setItem('__theme', g_theme)
    handleSkin(g_theme)
}

export function getTheme() {
    return g_theme
}