import { useDialogModule, useFaasParams } from "."

export const useShowDialogContext = () => {
    const dialog = useDialogModule()
    const showDialog = (execDialog: any = {}, execPipes: any[]  = []) => 
        new Promise<any>((resolve, reject) => {
            if (execDialog.component) {
                execDialog.type = 'Custom'
            }
            if (!execDialog.type && !execDialog.props) {
                execDialog = { props: execDialog }
            }
            const dialogOnSubmit = (data: {}) => {
                execDialog.props?.onSubmit?.()
                resolve({ type: 'submit', data })
                dialog.hide()
            }
            const dialogOnCancel = () => {
                resolve({ type: 'cancel' })
                dialog.hide()
            }
            const dialogOnConfirm = async (val: any) => {
                for await (const pipe of execPipes) {
                    await pipe(val)
                }
            }
            const dialogonAction = async (type: 'submit' | 'cancel' | 'confirm', data = {}) => {
                if (type === 'submit') {
                    dialogOnSubmit(data)
                } else if (type === 'cancel') {
                    dialogOnCancel()
                } else if (type === 'confirm') {
                    await dialogOnConfirm(data)
                }
            }
            dialog.show(execDialog, { 
                props: {
                    onAction: dialogonAction
                }
            })
        }
    )
    return showDialog
}