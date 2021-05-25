type VNode = {
  tag: string
  key: string | null
  props: Props | null
  children: Children
  el: Node | null
}
type ChildrenElement = string | VNode
type Children = ChildrenElement[] | null
type Props = {
  [key: string]: any
}

type NonUndefined<T> = T extends undefined ? never : T

function isVnode(vnode: any): vnode is VNode {
  return vnode.tag !== undefined
}

function vnode(
  tag: string,
  key: string | null,
  props: Props | null,
  children: Children,
  el: Element | null,
): VNode {
  return {
    tag,
    key,
    props,
    children,
    el,
  }
}

function isSameVNode(v1: VNode, v2: VNode): boolean {
  return v1.tag === v2.tag && v1.key === v2.key
}

function createOldKeyToIdx(
  children: VNode[],
  startIdx: number,
  endIdx: number,
): {[key: string]: number} {
  let map: {[key: string]: number} = {}
  while (startIdx <= endIdx) {
    const key = children[startIdx].key
    if (key !== null) {
      map[key] = startIdx
    }
    startIdx++
  }

  return map
}

export function h(
  tag: string,
  props: Props,
  children: ChildrenElement | Children,
): VNode {
  const key = props && props.key ? '' + props.key : null
  let c

  if (!children) c = null
  else if (!Array.isArray(children)) {
    c =
      typeof children === 'string'
        ? [vnode('#text', null, null, [children], null)]
        : [children]
  } else {
    c = children.map(ch => {
      return typeof ch === 'string'
        ? vnode('#text', null, null, [ch], null)
        : ch
    })
  }

  const _props = {...props}
  Reflect.deleteProperty(_props, 'key')

  return vnode(tag, key, _props, c, null)
}

function createEmptyVnode(el: Element): VNode {
  const props: Props = {}
  // convert a real node into a vnode
  if (el.id) props.id = el.id
  if (el.className) props.className = el.className
  const tag = el.tagName.toLowerCase()

  return vnode(tag, null, props, null, el)
}

function createElement(vnode: VNode): Node {
  let el
  if (vnode.tag === '#text') {
    el = document.createTextNode(vnode.children![0] as string)
    vnode.el = el

    return vnode.el
  }

  el = document.createElement(vnode.tag)
  vnode.el = el

  for (const attr in vnode.props) {
    const v = vnode.props[attr]

    if (attr.startsWith('on')) {
      const event = attr.replace('on', '').toLowerCase()
      el.addEventListener(event, v)
    } else if (attr === 'className') {
      el.className = v
    } else if (attr === 'style') {
      for (const s in v) {
        el.style[s as any] = v[s]
      }
    } else {
      el.setAttribute(attr, v)
    }
  }

  if (vnode.children) {
    for (const ch of vnode.children) {
      let c

      if (typeof ch === 'string') {
        c = document.createTextNode(ch)
      } else if (isVnode(ch)) {
        c = createElement(ch)
      }

      if (c) {
        vnode.el.appendChild(c)
      }
    }
  }

  return vnode.el
}

function patchProps(oldVnode: VNode, vnode: VNode) {
  if (vnode.tag === '#text') return

  const el = vnode.el as HTMLElement
  let oldAttrs = oldVnode.props
  let attrs = vnode.props

  if (!oldAttrs && !attrs) return
  if (oldAttrs === attrs) return

  oldAttrs = oldAttrs ?? {}
  attrs = attrs ?? {}

  for (const attr in attrs) {
    const cur = attrs[attr]
    const old = oldAttrs[attr]

    if (cur !== old) {
      if (cur === true) {
        el.setAttribute(attr, '')
      } else if (cur === false) {
        el.removeAttribute(attr)
      } else if (attr.startsWith('on')) {
        const event = attr.replace('on', '').toLowerCase()
        el.removeEventListener(event, old)
        el.addEventListener(event, cur)
      } else if (attr === 'className') {
        // can use classList to change class in a more fine granted level.
        let curCls = cur.split(' ')
        let oldCls = old.split(' ')

        for (const c of curCls) {
          el.classList.add(c)
        }

        for (const c of oldCls) {
          if (!curCls.includes(c)) {
            el.classList.remove(c)
          }
        }
      } else if (attr === 'style') {
        for (const s in cur) {
          el.style[s as any] = cur[s]
        }

        for (const s in old) {
          if (!(s in cur)) {
            el.style[s as any] = null as any
          }
        }
      }
    }
  }

  for (const attr in oldAttrs) {
    if (!(attr in attrs)) {
      el.removeAttribute(attr)
    }
  }
}

function updateChildren(parentEl: Node, oldCh: Children, ch: Children) {
  let oldStartIdx = 0
  let oldEndIdx = oldCh!.length - 1
  let oldStartVNode = oldCh![oldStartIdx]
  let oldEndVNode = oldCh![oldEndIdx]
  let newStartIdx = 0
  let newEndIdx = ch!.length - 1
  let newStartVNode = ch![newStartIdx]
  let newEndVNode = ch![newEndIdx]
  let oldKeyToIdx

  while (newStartIdx <= newEndIdx && oldStartIdx <= oldEndIdx) {
    if (oldStartVNode === null) {
      oldStartVNode = oldCh![++oldStartIdx]
    } else if (oldEndVNode === null) {
      oldEndVNode = oldCh![--oldEndIdx]
    } else if (newStartVNode === null) {
      newStartVNode = ch![++newStartIdx]
    } else if (newEndVNode === null) {
      newEndVNode = ch![--newEndIdx]
    } else if (isSameVNode(oldStartVNode as VNode, newStartVNode as VNode)) {
      patchVnode(oldStartVNode as VNode, newStartVNode as VNode)
      oldStartVNode = oldCh![++oldStartIdx]
      newStartVNode = ch![++newStartIdx]
    } else if (isSameVNode(oldEndVNode as VNode, newEndVNode as VNode)) {
      patchVnode(oldEndVNode as VNode, newEndVNode as VNode)
      oldEndVNode = oldCh![--oldEndIdx]
      newEndVNode = ch![--newEndIdx]
    } else if (isSameVNode(oldStartVNode as VNode, newEndVNode as VNode)) {
      patchVnode(oldStartVNode as VNode, newEndVNode as VNode)
      parentEl.insertBefore(
        (oldStartVNode as VNode).el!,
        (oldEndVNode as VNode).el!.nextSibling,
      )
      oldStartVNode = oldCh![++oldStartIdx]
      newEndVNode = ch![--newEndIdx]
    } else if (isSameVNode(oldEndVNode as VNode, newStartVNode as VNode)) {
      patchVnode(oldEndVNode as VNode, newStartVNode as VNode)
      parentEl.insertBefore(
        (oldEndVNode as VNode).el!,
        (oldStartVNode as VNode).el,
      )
      oldEndVNode = oldCh![--oldEndIdx]
      newStartVNode = ch![++newStartIdx]
    } else {
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createOldKeyToIdx(
          oldCh as VNode[],
          oldStartIdx,
          oldEndIdx,
        )
      }
      let idxInOld = oldKeyToIdx[(newStartVNode as VNode).key!]
      // new node
      if (idxInOld === undefined) {
        parentEl.insertBefore(
          createElement(newStartVNode as VNode),
          (oldStartVNode as VNode).el,
        )
      } else {
        // move to the target position
        let elToMove = oldCh![idxInOld]
        if ((elToMove as VNode).tag !== (newStartVNode as VNode).tag) {
          parentEl.insertBefore(
            createElement(newStartVNode as VNode),
            (oldStartVNode as VNode).el,
          )
        } else {
          patchVnode(elToMove as VNode, newStartVNode as VNode)
          oldCh![idxInOld] = undefined as any
          parentEl.insertBefore(
            (elToMove as VNode).el!,
            (oldStartVNode as VNode).el,
          )
        }
      }

      newStartVNode = ch![++newStartIdx]
    }
  }

  if (newStartIdx <= newEndIdx || oldStartIdx <= oldEndIdx) {
    if (oldStartIdx > oldEndIdx) {
      let before =
        ch![newEndIdx + 1] == null ? null : (ch![newEndIdx + 1] as VNode).el
      addVNodes(parentEl, before, ch, newStartIdx, newEndIdx)
    } else {
      removeVNodes(parentEl, oldCh, oldStartIdx, oldEndIdx)
    }
  }
}

function addVNodes(
  parentEl: Node,
  before: Node | null,
  vnodes: Children,
  startIdx: number,
  endIdx: number,
) {
  while (startIdx <= endIdx) {
    const ch = vnodes![startIdx]
    parentEl.insertBefore(createElement(ch as VNode), before)
    startIdx++
  }
}

function removeVNodes(
  parentEl: Node,
  vnodes: Children,
  startIdx: number,
  endIdx: number,
) {
  while (startIdx <= endIdx) {
    const ch = vnodes![startIdx] as VNode
    parentEl.removeChild(ch.el!)
    startIdx++
  }
}

// if 2 nodes are the same (tag and key), then call the below function to patch oldVnode with the vnode
function patchVnode(oldVnode: VNode, vnode: VNode) {
  const el = (vnode.el = oldVnode.el)!
  patchProps(oldVnode, vnode)

  const oldCh = oldVnode.children
  const ch = vnode.children

  if (vnode.tag !== '#text') {
    if (oldVnode.tag !== '#text') {
      if (oldCh && ch) {
        if (oldCh !== ch) updateChildren(el, oldCh, ch)
      } else if (ch) {
        addVNodes(el, null, ch, 0, ch.length - 1)
      } else if (oldCh) {
        removeVNodes(el, oldCh, 0, oldCh.length - 1)
      }
    } else {
      el.textContent = ''

      if (ch) {
        addVNodes(el, null, ch, 0, ch.length - 1)
      }
    }
  } else {
    if (oldVnode.tag !== '#text') {
      if (oldCh) {
        removeVNodes(el, oldCh, 0, oldCh.length - 1)
      }
    } else {
      if (oldCh![0] === ch![0]) return
    }

    el.textContent = ch![0] as string
  }
}

export function patch(oldVnode: Element | VNode, vnode: VNode) {
  if (!isVnode(oldVnode)) {
    oldVnode = createEmptyVnode(oldVnode)
  }

  if (isSameVNode(oldVnode, vnode)) {
    patchVnode(oldVnode, vnode)
  } else {
    const parent = oldVnode.el?.parentNode

    createElement(vnode)

    parent?.insertBefore(vnode.el!, oldVnode.el?.nextSibling!)
    parent?.removeChild(oldVnode.el!)
  }

  console.log(oldVnode)
  console.log(vnode)

  return vnode
}
