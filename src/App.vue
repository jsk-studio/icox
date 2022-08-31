<template>
    <TreeRender :tree="renderTree" />
</template>

<script setup lang="ts">
import { TreeRender, parseFlattenArray } from "../lib-src"

const renderFormTree = [{
    name: 'biz_from',
    label: '测试123',
    source: [{ label: '测试标签', val: 1 }, { label: '测试标签2', val: 2 }],
    defaultValue: ({ store }: any) => 2,
    rules: { required: true },
}]

const renderTree = {
    type: 'Form',
    stableKey: true,
    props: { 
        list: parseFlattenArray(renderFormTree, [
            ['biz_from'],
        ]),
        attrs: { labelWidth: '160px', inline: true },
    },
}

</script>