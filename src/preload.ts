import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld('ipc', {
    establishConnectionToBackground: (onMessage: (ev: MessageEvent) => unknown) => {
        const { port1, port2 } = new MessageChannel()

        port1.onmessage = (e) => {
            onMessage({ ...e.data })
            console.log(e.data)
            console.log('message')
        }

        console.log('HI')

        ipcRenderer.postMessage('background-port', '*', [port2])

        return port1
    }
})
