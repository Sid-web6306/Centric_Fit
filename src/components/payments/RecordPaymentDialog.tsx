'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { IndianRupee, Banknote, Smartphone, CreditCard, ArrowLeftRight, MoreHorizontal } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRecordPayment, type RecordPaymentInput } from '@/hooks/use-member-payments'

const schema = z.object({
  amount_rupees: z
    .string()
    .min(1, 'Amount is required')
    .refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount'),
  payment_method: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'other']),
  payment_date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const METHOD_OPTIONS = [
  { value: 'cash',          label: 'Cash',          icon: Banknote },
  { value: 'upi',           label: 'UPI',            icon: Smartphone },
  { value: 'card',          label: 'Card',           icon: CreditCard },
  { value: 'bank_transfer', label: 'Bank Transfer',  icon: ArrowLeftRight },
  { value: 'other',         label: 'Other',          icon: MoreHorizontal },
] as const

interface RecordPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberId: string
  gymId: string
  memberName?: string
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  memberId,
  gymId,
  memberName,
}: RecordPaymentDialogProps) {
  const mutation = useRecordPayment()
  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      payment_method: 'cash',
      payment_date: today,
    },
  })

  const paymentMethod = watch('payment_method')

  const onSubmit = async (values: FormValues) => {
    const input: RecordPaymentInput = {
      member_id: memberId,
      gym_id: gymId,
      amount_rupees: Number(values.amount_rupees),
      payment_method: values.payment_method,
      notes: values.notes || undefined,
      payment_date: values.payment_date,
    }
    await mutation.mutateAsync(input)
    reset({ payment_method: 'cash', payment_date: today })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-green-600" />
            Record Payment
          </DialogTitle>
          {memberName && (
            <DialogDescription>
              Recording a payment for <span className="font-medium text-foreground">{memberName}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                placeholder="500"
                className="pl-7"
                {...register('amount_rupees')}
              />
            </div>
            {errors.amount_rupees && (
              <p className="text-xs text-destructive">{errors.amount_rupees.message}</p>
            )}
          </div>

          {/* Payment method */}
          <div className="space-y-1.5">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-5 gap-2">
              {METHOD_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('payment_method', value)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs font-medium transition-colors ${
                    paymentMethod === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
            {errors.payment_method && (
              <p className="text-xs text-destructive">{errors.payment_method.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="payment_date">Payment Date</Label>
            <Input id="payment_date" type="date" {...register('payment_date')} />
            {errors.payment_date && (
              <p className="text-xs text-destructive">{errors.payment_date.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="notes"
              placeholder="e.g. Monthly fee — July 2026"
              {...register('notes')}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="gap-2">
              <IndianRupee className="h-4 w-4" />
              {mutation.isPending ? 'Saving…' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
