import { h, patch } from 'frame'

const container = document.querySelector('#root')!
let vnode: any

let v1 = h(
  'section',
  {
    className: 'one two three',
    style: {fontWeight: 'bold', border: '1px solid black'},
  },
  [
    h('h1', null, 'Title'),
    ' and this is just normal text',
    h('span', {style: {fontWeight: 'bold'}}, 'Inner text'),
    h('div', null, [
      h(
        'button',
        {
          style: {marginTop: '5px'},
          onClick: () => console.log('clicked'),
        },
        'click me!',
      ),
    ]),
    h('a', {href: '/foo'}, "I'll take you places!"),
  ],
)

let v2 = h(
  'section',
  {
    className: 'two three',
    style: {fontStyle: 'italic', border: '1px solid orange'},
  },
  [
    h('h1', null, 'Document'),
    h('span', {style: {fontWeight: 'bold'}}, 'Inner text'),
    ' and this is just normal text',
    h('a', {href: '/foo'}, "I'll take you places!"),
    h('div', null, [
      h(
        'button',
        {
          style: {marginTop: '5px'},
          onClick: () => console.log('Changed'),
        },
        'click me!',
      ),
    ]),
  ],
)

vnode = patch(container, v1)

let count = 0
document.addEventListener('click', () => {
  count += 1
  vnode = patch(vnode, count % 2 === 0 ? v1 : v2)
})
