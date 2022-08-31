import { traverseTree } from '../utils'
import cloneDeep from 'lodash/cloneDeep'
import TreeRender from '../render/TreeRender.vue'

type IDefineImport = () => Promise<any>
type IDefineRoutes<T> = {
  [key in keyof T] : [ string, IDefineImport | any] 
}
type IDefineSidebarItem<T> =  {
  title: string,
  icon?: string,
  route?: T | T[],
}
type IDefineRoutesOption<T> = {
    routes: IDefineRoutes<T>,
    sidebar?: any,
    mapping?: any,
    title?: string,
    extra?: any,
}

type ISidebarPageOptions = {
  title?: string,
  allMenus: any[],
  menu: any[],
  extra: any,
}

function createSidebarPage(opts: ISidebarPageOptions) {
  const { title, allMenus, menu, extra } = opts
  return {
      type: 'Page',
      props: { extra },
      slots: [{
        
      },{
          type: 'Sidebar',
          props: { title },
          slots: [{
              type: 'SidebarMenu',
              props: { allMenus, menu }
          }]
      }]
  }
}

export function defineSidebarRoutes<T>(opts: IDefineRoutesOption<T>) {
    const { routes, sidebar, mapping, title, extra } = opts
    const newRoutes = Object.keys(routes).map(name => {
        const [ path, tree ] = routes[name as keyof typeof routes]
        return { name, path, component: TreeRender, props: { tree } }
    })
    const extraRoutes = Object.keys(extra).map(name => {
      const [ path, tree ] = extra[name as keyof typeof extra]
      return { name, path, component: TreeRender, props: { tree } }
    })

    const newSidebar = [] as ISidebarTree
    if (sidebar) {
        for (const item of sidebar) {
            const titles = item.title.split('|')
            generateTree(newSidebar, titles, item)
        }
    }

    const maplist = {} as any
    for (const key of Object.keys(mapping)) {
        maplist[key] = createSidebarPage({
          title, 
          // 如果是扩展路由, 则不展示 sidebar
          extra: Object.keys(extra),
          allMenus: newSidebar, 
          menu: mapping[key],
        })
    }

    return {
        routes: Object.assign(newRoutes, extraRoutes),
        sidebar: newSidebar,
        maplist: maplist,
    }
}

type ISidebarNode = {
  children?: ISidebarNode[],
  title?: string,
  name?: string,
  icon?: string,
}

type ISidebarTree = ISidebarNode[]

function generateTree<T>(tree: ISidebarTree, titles: string[], item: IDefineSidebarItem<T>) {
  if (!titles || !titles.length) {
    return
  }
  const node = tree.find(node => node.title === titles[0]) || { children: [] }
  if (!node.title) {
    node.title = titles[0]
    tree.push(node)
  }
  generateTree(node.children!, titles.slice(1), item)
  if (item.icon && titles.length === 1) {
    node.icon = item.icon
  }
  if (item.route && titles.length === 1) {
    if (Array.isArray(item.route)) {
      for (const route of item.route.slice(1)) {
        tree.push({ ...node, name: route as any as string })
      }
      node.name = item.route[0] as any as string
    } else {
      node.name = item.route as any as string
    }
  }
}

// export function defineSidebar<T>(items: IDefineSidebarItem<T>[]) {
//   const tree = [] as ISidebarTree
//   for (const item of items) {
//     const titles = item.title.split('|')
//     generateTree(tree, titles, item)
//   }
//   return tree as any as T
// }

// export function defineSidebarPage<T, Q extends T>(allMenus: T, allows: Q[]) {
//   const template = cloneDeep(sidebarPageTemplate)
//   traverseTree(template, {
//     CustomRender(node: any) {
//       if (node.name === 'SidebarMenu') {
//         node.arguments.push({ key: 'allMenus', value: allMenus })
//         node.arguments.push({ key: 'menu', value: allows })
//       }
//     }
//   })
//   return template as any as T
// }