import { cloneDeep } from "lodash"
import { traverseTree } from "."
import Page from '../components/Page.vue'
import Blank from '../components/Blank.vue'
import Detail from '../components/detail/Detail.vue'
import List from '../components/list/List.vue'
import Filter from '../components/list/Filter.vue'
import Form from '../components/form/Form.vue'
import FormItem from '../components/form/FormItem.vue'
import ButtonGroup from '../components/action/ButtonGroup.vue'
import Button from '../components/action/Button.vue'
import Table from '../components/table/Table.vue'
import TableColumn from '../components/table/TableColumn.vue'
import Pagination from '../components/table/Pagination.vue'
import Dialog from '../components/dialog/Dialog.vue'
import Sidebar from '../components/sidebar/Sidebar.vue'
import SidebarMenu from '../components/sidebar/SidebarMenu.vue'


type ICustomNode = any
export type ICustomTree = ICustomNode & {
    slots: ICustomNode[]
}

export const DEFINED_IMPORTS = {
    Page,
    Blank,
    Detail,
    List,
    Filter,
    Form,
    FormItem,
    Button,
    ButtonGroup,
    Table,
    TableColumn,
    Pagination,
    Dialog,
    Sidebar,
    SidebarMenu,
} as any

export function parseToOriginTree(tree: any) {
    if (tree.mode === 'OriginTree') {
        return tree
    }
    const originTree = cloneDeep(tree)
    originTree.mode = 'OriginTree'
    traverseTree(originTree, {
        preorder: (node) => {
            // 补默认 type 为 Custom
            if (node.component && !node.type) {
                node.type = 'Custom'
            }
            if (!node.type) {
                return
            }
            if (node.type !== 'CustomRender') {
                node.arguments = []
                const importArgv = {
                    type: "ImportDeclaration",
                    key: "custom-component",
                } as any
                if (node.type === 'Custom') {
                    importArgv.value = node.component
                    delete node.component
                } else {
                    importArgv.value = DEFINED_IMPORTS[node.type]
                }
                node.arguments.push(importArgv)
                node.type = "CustomRender"
            }
            if (node.props) {
                for (const key of Object.keys(node.props)) {
                    node.arguments.push({
                        type: "CustomDeclaration",
                        key,
                        value: node.props[key],
                    })
                }
                delete node.props
            }
            if (node.slots) {
                node.children = node.slots
                for (const child of node.children) {
                    // 默认使用 type 作为 name
                    if (!child.name && child.type) {
                        child.name = child.type
                    }
                }
            }
            delete node.slots
            if (!node.arguments.length) {
                delete node.arguments
            }
        }
    })
    return originTree
}
