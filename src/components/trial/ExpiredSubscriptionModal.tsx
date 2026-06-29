'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, CheckCircle, Users, CreditCard } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/hooks/use-trial'

interface ExpiredSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onCancelSubscription: () => void
  onUpdateSubscription: () => void
  plans?: Array<{
    id: string
    name: string
    price_monthly_inr: number
    price_annual_inr: number
    features?: string[]
    member_limit?: number
  }>
  isLoading?: boolean
}

export function ExpiredSubscriptionModal({
  isOpen,
  onClose,
  onCancelSubscription,
  onUpdateSubscription,
  plans = [],
  isLoading = false
}: ExpiredSubscriptionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-red-500" />
            Subscription Expired
          </DialogTitle>
          <DialogDescription>
            Your subscription has expired. You can either cancel your account or update to a new plan to continue using our services.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Access Restricted</CardTitle>
              <CardDescription className="text-red-600">
                Your subscription has expired and you no longer have access to premium features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Expired</Badge>
                <span className="text-sm text-red-600">
                  You can still view your data but cannot add new members or access premium features.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Available Plans */}
          {plans.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {plans.map((plan) => (
                  <Card key={plan.id} className="relative">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {plan.name === 'Professional' && <Crown className="h-5 w-5 text-yellow-500" />}
                        {plan.name}
                      </CardTitle>
                      <CardDescription>
                        {formatCurrency(plan.price_monthly_inr)}/month or {formatCurrency(plan.price_annual_inr)}/year
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {plan.features && plan.features.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Features:</h4>
                            <ul className="space-y-1">
                              {plan.features.map((feature: string, index: number) => (
                                <li key={index} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {plan.member_limit && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            Up to {plan.member_limit} members
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancelSubscription}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel Account
          </Button>
          <Button
            onClick={onUpdateSubscription}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Update Subscription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 