'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Lock, ArrowUp, TrendingUp, Star, Crown, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LockedChartProps {
  children: React.ReactNode
  title: string
  description?: string
  requiredPlan: 'starter' | 'professional' | 'enterprise'
  onUpgrade?: () => void
  className?: string
  showUpgradeButton?: boolean
}

const planInfo = {
  starter: {
    name: 'Starter',
    icon: Star,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    gradient: 'from-blue-500 to-blue-600'
  },
  professional: {
    name: 'Professional',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    gradient: 'from-purple-500 to-purple-600'
  },
  enterprise: {
    name: 'Enterprise',
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    gradient: 'from-amber-500 to-amber-600'
  }
}

export function LockedChart({ 
  children, 
  title, 
  description, 
  requiredPlan, 
  onUpgrade,
  className,
  showUpgradeButton = true 
}: LockedChartProps) {
  const plan = planInfo[requiredPlan]
  const PlanIcon = plan.icon

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Blurred Content */}
      <div className="blur-sm opacity-60 pointer-events-none">
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center p-6 max-w-sm">
          {/* Lock Icon */}
          <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4', plan.bgColor)}>
            <Lock className={cn('w-8 h-8', plan.color)} />
          </div>

          {/* Title and Description */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mb-4">{description}</p>
          )}

          {/* Required Plan Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="outline" className={cn('border-2', plan.borderColor)}>
              <PlanIcon className={cn('w-3 h-3 mr-1', plan.color)} />
              {plan.name} Plan
            </Badge>
            <span className="text-sm text-gray-500">required</span>
          </div>

          {/* Upgrade Button */}
          {showUpgradeButton && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className={cn('bg-gradient-to-r', plan.gradient)}>
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Upgrade to {plan.name}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <PlanIcon className={cn('w-5 h-5', plan.color)} />
                    Upgrade to {plan.name} Plan
                  </DialogTitle>
                  <DialogDescription>
                    Get access to this chart and other advanced analytics features with the {plan.name} plan.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className={cn('p-4 rounded-lg', plan.bgColor)}>
                    <h4 className="font-medium text-gray-900 mb-2">What you'll unlock:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {requiredPlan === 'starter' && (
                        <>
                          <li>• Basic member analytics</li>
                          <li>• Simple attendance tracking</li>
                          <li>• Monthly reports</li>
                        </>
                      )}
                      {requiredPlan === 'professional' && (
                        <>
                          <li>• Advanced member analytics</li>
                          <li>• Revenue tracking & insights</li>
                          <li>• Growth trend analysis</li>
                          <li>• Custom date ranges</li>
                        </>
                      )}
                      {requiredPlan === 'enterprise' && (
                        <>
                          <li>• AI-powered predictive analytics</li>
                          <li>• Cohort-based retention analysis</li>
                          <li>• API access for integrations</li>
                          <li>• Custom report builder</li>
                          <li>• Priority support</li>
                        </>
                      )}
                    </ul>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.location.href = '/settings/subscription'}
                    >
                      View All Plans
                    </Button>
                    <Button 
                      className={cn('flex-1 bg-gradient-to-r', plan.gradient)}
                      onClick={onUpgrade}
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </Card>
  )
}

export default LockedChart
