<template>
    <CustomRender v-if="stableTree" :tree="stableTree" ref="custom" :key="stableKey" />
</template>
<script>

// <teleport to="#editor-masks">
//     <div v-if="editMode" class="editor-covers">
//         <div class="editor-cover" v-for="(area, i) in editorAreas" :key="i" :style="{
//             top: area.rect.top + 'px',
//             left: area.rect.left + 'px',
//             width: area.rect.width + 'px',
//             height: area.rect.height + 'px',
//             zIndex: coverIndex,
//         }" >
//             <div class="edit-btn" @click="onEdit(area.target)">编辑</div>
//         </div>
//         <EditorPanel 
//             :visible="panelVisible" 
//             :onClose="() => panelVisible = false"
//             :target="panelTarget"
//             :context="stableTree"
//         />
//     </div>
// </teleport>
import { cloneDeep } from 'lodash'
import { parseToOriginTree } from '../utils'
import CustomRender from './CustomRender.vue'
// import EditorPanel from './EditorPanel.vue'

function getComponentAreas(node, areas = []) {
    if (!node) {
        return areas
    }
    if (node.$el && node.$options.name === 'CustomRender' && node.$el.getBoundingClientRect) {
        const rect = node.$el.getBoundingClientRect()
        areas.push({ rect, target: node })
    }
    if (node.$data.$children) {
        for (const child of node.$data.$children) {
            getComponentAreas(child, areas)
        }
    }
    return areas
}
export default {
    data() {
        return {
            editMode: false,
            editorAreas: [],
            panelVisible: false,
            panelTarget: {},
            coverIndex: 999,
            stableTree: null,
            stableKey: 1,
        }
    },
    props: ['tree', 'args'],
    components: { CustomRender },
    methods: {
        onEdit(e) {
            this.panelVisible = true
            this.panelTarget = e
        },
        onClear() {
            this.panelVisible = false
            this.editMode = false
            this.editorAreas = []
            this.panelTarget = {}
        },
        async stable(tree) {
            if (typeof tree === 'function') {
                this.stableTree = (await tree()).default
            } else {
                this.stableTree = tree
            }
            if (!this.stableTree) {
                return
            }
            this.stableTree = parseToOriginTree(this.stableTree)
            
            if (this.args) {
                this.stableTree = cloneDeep(this.stableTree)
                for (const key of Object.keys(this.args)) {
                    this.stableTree.arguments.push({
                        type: 'ExtraArgsDeclaration',
                        key: key,
                        value: this.args[key]
                    })
                }
            }
            if (this.stableTree.stableKey) {
                this.stableKey ++
            }
        }
    },
    watch: {
        tree(val) {
            this.stable(val)
        }
    },
    async mounted() {
        this.stable(this.tree)
        window.addEventListener('mousewheel', this.onClear)
        window.addEventListener('resize', this.onClear)
        window.addEventListener('keypress', (e) => {
            // 进入编辑模式
            if (e.key === 'q' && e.ctrlKey) {
                this.editMode = !this.editMode
                if (this.editMode) {
                    const renderNode = this.$refs.custom
                    this.editorAreas = getComponentAreas(renderNode)
                } else {
                    this.onClear()
                }
            }
        })
    }
}
</script>
<style scoped>
.editor-cover {
    position: fixed;
    background-color: rgba(64, 64, 64, 0.11);
}
.editor-cover:hover  {
    background-color: rgba(255,0,0, .2);
}
.edit-btn {
    padding: 2px 5px;
    background-color: rgba(255,255,255, 1);
    position: absolute;
    right: 0;
    top: 0;
    cursor: pointer;
    font-size: 12px;
}
</style>
