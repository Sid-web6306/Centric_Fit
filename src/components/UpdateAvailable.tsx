'use client'

import { useVersionCheck } from '@/hooks/use-version-check'
import { Button } from '@/components/ui/button'
import { RefreshCw, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function UpdateAvailable() {
  const { updateAvailable, dismiss, refresh } = useVersionCheck({
    pollingInterval: 60000, // Check every minute
    enabled: true,
  })

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[400px] z-[9999]"
        >
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg shadow-2xl p-4 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-white/20 rounded-full">
                <RefreshCw className="h-5 w-5 animate-spin-slow" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">
                  New Update Available! 🎉
                </h3>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  A new version of Centric Fit is ready. Refresh to get the latest features and improvements.
                </p>
                
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={refresh}
                    size="sm"
                    variant="secondary"
                    className="bg-white text-primary hover:bg-white/90 font-medium"
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Refresh Now
                  </Button>
                  <Button
                    onClick={dismiss}
                    size="sm"
                    variant="ghost"
                    className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                  >
                    Later
                  </Button>
                </div>
              </div>

              <button
                onClick={dismiss}
                className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
