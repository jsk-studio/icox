import TreeRender from '../render/TreeRender.vue'
import { x_array } from '../utils/x'
import { getCoxAppState } from './register'

type ISidebarNode = {
    children?: ISidebarNode[],
    title?: string,
    name?: string,
    icon?: string,
  }
  
  type ISidebarTree = ISidebarNode[]

type IDefineImport = () => Promise<any>
type IDefineRoutes<T> = {
  [key in keyof T] : { 
    path: string, 
    load: IDefineImport | any
  }
}
type IDefineSidebarItem<T> =  {
  title: string,
  icon?: string,
  route?: T | T[],
}
type IDefineRoutesOption<T> = {
    routes: any[],
    sidebar?: any,
    mapping?: any,
    title?: string,
    extra?: any,
}

type ISidebarPageOptions = {
  title?: string,
  allMenus: any[],
  menu: any[],
}


function createSidebarPage(opts: ISidebarPageOptions) {
  const coxState = getCoxAppState()
  const { Header } = coxState.components
  const { title, allMenus, menu } = opts
  return {
      type: 'Page',
      slots: [{
          name: 'Header',
          component: Header
      },{
          type: 'Sidebar',
          props: { title, allMenus },
          slots: [{
              type: 'SidebarMenu',
              props: { allMenus, menu }
          }]
      }]
  }
}

function createNosidebarTree() {
  const coxState = getCoxAppState()
  const { Header } = coxState.components
  const nosidebarTree = {
    type: 'Page',
    slots: [{
        name: 'Header',
        component: Header
    }]
  }
  return nosidebarTree
}


export function defineSidebarRouter<T>(opts: IDefineRoutesOption<T>) {
    const { routes, sidebar = [], mapping = {}, title, extra } = opts

    const extRoutesMap = {} as any
    // const noSidebarList = [] as any
    const statusList = { } as any

    function mapRoutes(routes: any[]) {
      const extRoutes = [] as any[]
      const newRoutes = routes.map(route => {
          const { load, status, alias, ...others } = route
          let { exts } = route
          if (!exts && Array.isArray(alias)) {
            exts = alias.map(name => ({ name }))
          }
          if (load.component) {
            load.stableKey = true
          }
          x_array(status).forEach(s => {
            if (!statusList[s]?.includes(route.name)) {
              statusList[s] = statusList[s] || []
              statusList[s].push(route.name)
            }
          })

          // if (attrs.nosidebar && !noSidebarList.includes(route.name)) {
          //   noSidebarList.push(route.name)
          // }
          const metaMapping = {} as any
          if (exts) {
            extRoutesMap[route.name] = [route.name].concat(exts.map((e: any) => e.name))
            for (const ext of exts) {
              const { load: exload, ...exOthers } = ext
              extRoutes.push({ 
                ...others,
                ...exOthers,
                component: TreeRender, 
                props: { tree: exload || load } , 
                from: route.name, 
              })
              for (const mapkey of Object.keys(mapping)) {
                const mapvalue = mapping[mapkey]
                if (mapvalue.includes(ext.name)) {
                  metaMapping[mapkey] = ext.name
                }
              }
            }
          }
          return { 
            ...others, 
            component: TreeRender, 
            props: { tree: load },
            meta: { mapping: metaMapping }
          }
      })
      return newRoutes.concat(extRoutes).filter(Boolean)
    }

    const newRoutes = mapRoutes(routes)
    const newSidebar = [] as ISidebarTree
    const metaMap = {} as any
    if (sidebar) {
        for (const item of sidebar) {
            const titles = item.title.split('|')
            // 移除相关 api, 更期望的是手动配置 sidebar 列表显示
            // item.route = extRoutesMap[item.route] || item.route
            generateTree(newSidebar, titles, item, metaMap)
        }
    }
    const maplist = {} as any
    mapping._ = sidebar.map((x: any) => x.route).filter(Boolean)
    for (const key of Object.keys(mapping)) {
        maplist[key] = createSidebarPage({
          title, 
          allMenus: newSidebar, 
          menu: mapping[key],
        })
    }
    return {
        routes: newRoutes,
        sidebar: newSidebar,
        meta: metaMap,
        allMatch: maplist._,
        status: statusList,
        match: (biz: any) => maplist[biz] || createNosidebarTree(),
    }
}

function generateTree<T>(tree: ISidebarTree, titles: string[], item: IDefineSidebarItem<T>, metaMap: any = {}) {
  if (!titles || !titles.length) {
    return
  }
  const node = tree.find(node => node.title === titles[0]) || { children: [] }
  if (!node.title) {
    node.title = titles[0]
    tree.push(node)
  }
  generateTree(node.children!, titles.slice(1), item, metaMap)
  if (item.icon && titles.length === 1) {
    node.icon = item.icon
  }
  if (item.route && titles.length === 1) {
    if (node.name && item.route) {
      item.route = [node.name as any].concat(x_array(item.route))
    }
    if (Array.isArray(item.route)) {
      for (const route of item.route.slice(1)) {
        tree.push({ ...node, name: route as any as string })
      }
      node.name = item.route[0] as any as string
    } else {
      node.name = item.route as any as string
    }
  }
  if (node.name) {
    metaMap[node.name] = { ...node }
  }
}