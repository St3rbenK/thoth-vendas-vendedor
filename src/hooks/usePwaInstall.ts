import { useState, useEffect, useCallback } from 'react'

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

const DISMISS_STORAGE_KEY = 'thoth_pwa_install_dismissed_at'
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const mq = window.matchMedia?.('(display-mode: standalone)').matches
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return Boolean(mq || iosStandalone)
}

function detectIosSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua)
  return isIos && isSafari
}

function isBannerDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY)
    if (!raw) return false
    const ts = Number(raw)
    if (!Number.isFinite(ts)) return false
    return Date.now() - ts < DISMISS_TTL_MS
  } catch {
    return false
  }
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState<boolean>(() => detectStandalone())
  const [isIosSafari] = useState<boolean>(() => detectIosSafari())
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => isBannerDismissed())
  const [iosGuideOpen, setIosGuideOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia?.('(display-mode: standalone)')
    const onDisplayChange = () => setIsStandalone(detectStandalone())
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onAppInstalled = () => {
      setDeferredPrompt(null)
      setIsStandalone(true)
      setIosGuideOpen(false)
    }

    mq?.addEventListener('change', onDisplayChange)
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      mq?.removeEventListener('change', onDisplayChange)
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const canInstallPrompt = Boolean(deferredPrompt) && !isStandalone
  const canShowIosGuide = isIosSafari && !isStandalone && !deferredPrompt
  const canInstall = canInstallPrompt || canShowIosGuide
  const showBanner = canInstall && !bannerDismissed

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true)
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()))
    } catch {
      // ignore storage errors
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios_guide' | 'unavailable'> => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsStandalone(true)
      }
      return outcome
    }
    if (canShowIosGuide) {
      setIosGuideOpen(true)
      return 'ios_guide'
    }
    return 'unavailable'
  }, [deferredPrompt, canShowIosGuide])

  return {
    isStandalone,
    isIosSafari,
    canInstall,
    canInstallPrompt,
    canShowIosGuide,
    showBanner,
    iosGuideOpen,
    setIosGuideOpen,
    dismissBanner,
    promptInstall,
  }
}
