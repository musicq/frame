import {h, patch} from 'frame'

const container = document.querySelector('#root')!
const vnode = h(
  'div',
  {
    className: 'first two',
    onClick: () => console.log('clicked'),
  },
  [
    h('span', {style: {fontWeight: 'bold'}}, 'Inner text'),
    ' and this is just normal text',
    h('a', {href: '/foo'}, "I'll take you places!"),
  ],
)

patch(container, vnode)
