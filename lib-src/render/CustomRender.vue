<template>
    <component :is="customComponent" v-bind="customArguments" >
        <template v-for="(child, i) in children" v-slot:[child.name]="slotProps">
            <CustomRender :key="i" :tree="setupChildSlot(child, slotProps)" :ref="e => $children.push(e)" />
        </template>
    </component>
</template>
<script lang="ts">

import { matchArguments, excludeArguments } from "../utils"
export default {
    name: 'CustomRender',
    props: ['tree'],
    data () {
        return {
            $children: [] as any[]
        }
    },
    setup(props: any) {
        const children = props.tree.children
        const customComponent = matchArguments(props.tree, {
            key: 'custom-component',
            type: 'ImportDeclaration',
        })
        const customArguments = excludeArguments(props.tree, {
            key: 'custom-component',
            type: 'ImportDeclaration',
        })
        const setupChildSlot = (child: any, slotProps: any) => {
            for (const slotKey of Object.keys(slotProps)) {
                child.arguments.push({
                    type: 'CustomDeclaration',
                    key: slotKey,
                    value: slotProps[slotKey],
                })
            }
            return child
        }
        return {
            children,
            customComponent,
            customArguments,
            setupChildSlot,
        }
    },
}
</script>
