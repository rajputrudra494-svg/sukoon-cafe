import { boot, $, scrollToTarget, queueRefresh } from '../core.js'
import { kitchen, bar } from '../menu-data.js'
import { drawTerrazzo } from '../terrazzo.js'
import { initMenu } from '../menu-board.js'

// the menu card sits on the same terrazzo as the tables
function paintTerrazzo() {
  const c = drawTerrazzo(Object.assign(document.createElement('canvas'), { width: 900, height: 900 }), { base: '#e6dccd', density: 3 })
  $('[data-menu]').style.setProperty('--terrazzo', `url(${c.toDataURL('image/webp', 0.8)})`)
}

paintTerrazzo()
initMenu($('[data-menu]'), { kitchen, bar, onChange: queueRefresh, scrollTo: scrollToTarget })
boot()