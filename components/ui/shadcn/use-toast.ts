"use client"

import { ReactNode } from "react"
import { ToastActionElement, ToastProps } from "../feedback/Toast"

const TOAST_LIMIT = 20

type ToasterToast = ToastProps & {
  id: string
  title?: ReactNode
  description?: ReactNode
  action?: ToastActionElement
  duration?: number
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // If no id is provided, dismiss all
      if (toastId === undefined) {
        return {
          ...state,
          toasts: state.toasts.map((t) => ({
            ...t,
            open: false,
          })),
        }
      }

      // Dismiss specific toast
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId ? { ...t, open: false } : t
        ),
      }
    }

    case actionTypes.REMOVE_TOAST: {
      const { toastId } = action

      // If no id is provided, remove all
      if (toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }

      // Remove specific toast
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== toastId),
      }
    }
  }
}

function add(toast: Omit<ToasterToast, "id">) {
  const id = genId()

  const newToast = {
    ...toast,
    id,
    open: true,
    onOpenChange: (open: boolean) => {
      if (!open) dismiss(id)
    },
  }

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: newToast,
  })

  return id
}



function dismiss(toastId?: string) {
  dispatch({
    type: actionTypes.DISMISS_TOAST,
    toastId,
  })
}

function remove(toastId?: string) {
  dispatch({
    type: actionTypes.REMOVE_TOAST,
    toastId,
  })
}

export function useToast() {
  return {
    toasts: memoryState.toasts,
    toast: (props: Omit<ToasterToast, "id">) => add(props),
    dismiss: (toastId?: string) => dismiss(toastId),
    remove: (toastId?: string) => remove(toastId),
  }
} 