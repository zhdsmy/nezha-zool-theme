import { getNotification } from "@/api/notification"
import { getNotificationGroups } from "@/api/notification-group"
import { NotificationContextProps } from "@/types"
import { createContext, useContext, useEffect, useMemo } from "react"
import { useLocation } from "react-router-dom"
import { toast } from "sonner"

import { useNotificationStore } from "./useNotificationStore"

const NotificationContext = createContext<NotificationContextProps>({})

interface NotificationProviderProps {
    children: React.ReactNode
    withNotifier?: boolean
    withNotifierGroup?: boolean
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
    children,
    withNotifier,
    withNotifierGroup,
}) => {
    const notifierGroup = useNotificationStore((store) => store.notifierGroup)
    const setNotifierGroup = useNotificationStore((store) => store.setNotifierGroup)

    const notifiers = useNotificationStore((store) => store.notifiers)
    const setNotifier = useNotificationStore((store) => store.setNotifier)

    const location = useLocation()

    useEffect(() => {
        let active = true
        if (withNotifierGroup)
            (async () => {
                try {
                    const ng = await getNotificationGroups()
                    if (active) setNotifierGroup(ng)
                } catch (error: any) {
                    if (!active) return
                    toast("NotificationProvider Error", {
                        description: error.message,
                    })
                    setNotifierGroup(undefined)
                }
            })()
        if (withNotifier)
            (async () => {
                try {
                    const n = (await getNotification()) || []
                    const nData = n.map(({ id, name }) => ({ id, name }))
                    if (active) setNotifier(nData)
                } catch (error: any) {
                    if (!active) return
                    toast("NotificationProvider Error", {
                        description: error.message,
                    })
                    setNotifier(undefined)
                }
            })()
        return () => { active = false }
    }, [location.pathname, setNotifier, setNotifierGroup, withNotifier, withNotifierGroup])

    const value: NotificationContextProps = useMemo(
        () => ({
            notifiers: notifiers,
            notifierGroup: notifierGroup,
        }),
        [notifiers, notifierGroup],
    )
    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotification = () => {
    return useContext(NotificationContext)
}
