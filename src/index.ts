type VNode = {
  tag: string
  key: string | null
  props: Props
  children: Children
  elm: Element | undefined
}
type ChildrenElement = string | VNode
type Children = ChildrenElement | ChildrenElement[]
type Props = {
  [key: string]: string | boolean
}

export function h(
  tag: string,
  props: Props,
  children: Children,
  elm?: Element,
): VNode {
  let key = props.key ? '' + props.key : null

  return {
    tag,
    key,
    props,
    children,
    elm,
  }
}

export function patch(oldVnode: Element | VNode, vnode: VNode) {
  console.log(oldVnode)
  console.log(vnode)
}
