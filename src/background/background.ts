import { ipcRenderer } from "electron"
import { Client } from 'discord-rpc'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Registry } = require('rage-edit')

const registry = new Registry('HKCU\\Software\\Roblox\\RobloxStudioBrowser\\roblox.com')

interface Activity {
    state: string,
    details?: string,
    startTimestamp?: number,
    endTimestamp?: number,
    largeImageText?: string,
    smallImageText?: string,
    partyId?: string,
    partySize?: number,
    partyMax?: number,
    joinSecret?: string
}

let port: MessagePort
let currentActivity: Activity
let previousLocation: string
let startTimestamp: number
let robloxUser: Record<string, unknown>

const client = new Client({ transport: 'ipc' })

function postActivityMessage() {
    return port?.postMessage({
        activity: currentActivity,
        user: robloxUser
    })
}

ipcRenderer.on('port', (e) => {
    [port] = e.ports

    console.log('port')

    console.log(currentActivity)

    if (currentActivity) {
        postActivityMessage()
    }
})

async function getCookie() {
    const value = await registry.get('.ROBLOSECURITY')

    const data = value.split(',').reduce((acc: Record<string, unknown>, curr: string) => {
        const [key, value] = curr.split('::')
        return { ...acc, [key]: value.slice(1, -1) }
    }, {})

    if (data.COOK === undefined && data.EXP === undefined) {
        throw new Error('Failed to get cookie')
    } else {
        if (new Date(data.EXP).getTime() - Date.now() <= 0) {
            throw new Error('Login cookie has expired')
        }
    }

    return data
}

function getActivityFromPresence(presence: Record<string, unknown>): Activity {
    switch (presence.userPresenceType) {
        case 1:
            return {
                state: 'Browsing the website'
            }
        case 2:
            return {
                state: 'Playing a game',
                details: presence.lastLocation as string
            }
        case 3:
            return {
                state: 'Editing a game',
                details: presence.lastLocation as string
            }
        default:
            return null
    }
}

function get(...args: unknown[]) {
    return ipcRenderer.invoke('axios-get', ...args)
}

function post(...args: unknown[]) {
    return ipcRenderer.invoke('axios-post', ...args)
}

client.on('ready', () => {
    setInterval(async () => {
        const cookie = await getCookie()

        if (!robloxUser) {
            robloxUser = await get('https://users.roblox.com/v1/users/authenticated', {
                headers: {
                    Cookie: `.ROBLOSECURITY=${cookie.COOK}`
                }
            })
        }

        const presences = await post('https://presence.roblox.com/v1/presence/users', {
            userIds: [
                robloxUser.id
            ]
        }, {
            headers: {
                Cookie: `.ROBLOSECURITY=${cookie.COOK}`
            }
        })

        const presence = presences.userPresences[0]

        console.log(presence)

        if (previousLocation === presence.lastLocation) {
            return
        }

        previousLocation = presence.lastLocation

        currentActivity = getActivityFromPresence(presence as Record<string, unknown>)

        if (currentActivity) {
            await client.setActivity(currentActivity)
        } else {
            previousLocation = null
            await client.clearActivity()
        }

        console.log(currentActivity)

        postActivityMessage()
    }, 15000)
})

client.login({ clientId: '814221015961698354' })
