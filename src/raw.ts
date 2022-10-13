import { FaasConfRaw, FaasParams } from "../lib-src";

const BOOLEAN_MAP = {
    0: '否',
    1: '是',
}

export const page_raw: FaasConfRaw = {
    action: [{
        name: '@upload',
        text: '上传',
        attrs: { type: 'success' },
    }, {
        name: '@batch',
        text: '批量操作',
        attrs: { type: 'primary' },
    }],
    // filter 内容会自动注入到 query url
    filter: [{
        name: 'biz_from', // TODO: 暂未解耦业务方逻辑
        type: 'hidden', 
        defaultValue: -1,
    }, {
        name: 'type',
        label: '类型',
        source: getTypeOptions, 
        action: 'submit',
    }, {
        name: 'title',
        label: '标题',
    }],
    table: [{
        name: 'title',
        label: '标题',
    }, {
        label: "flag是否",
        name: "flag",
        format: BOOLEAN_MAP,
        attrs: { width: '80px' }
    }, {
        label: "上传时间",
        name: "ctime",
        type: "time",
        format: 'YYYY-MM-DD HH:mm:ss',
        attrs: { width: '100px', sortable: true },
    }, {
        name: "type",
        label: ({ filter }) => `类型: ${filter.type}`,
        attrs: { width: '120px' },
    }]
}
export function _sleep(t = 300) {
    return new Promise(res => {
        setTimeout(() => {
            res(null)
        }, t);
    })
   
}

async function getTypeOptions(faas: FaasParams) {
    return [
        { label: 'type1', val: 1 }, 
        { label: 'type2', val: 2 }, 
    ]
}