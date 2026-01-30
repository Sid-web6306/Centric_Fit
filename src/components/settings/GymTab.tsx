'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useUpdateGym, useGymData } from '@/hooks/use-gym-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
  Save,
  AlertCircle,
  Phone,
  Mail,
  Globe,
  MapPin,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toastActions } from '@/stores/toast-store'
import { GymLogoUpload } from './GymLogoUpload'

// Form schema - matching API validation
const gymSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
  address: z.string().max(255, 'Address must be less than 255 characters').optional().nullable(),
  phone: z.string().max(20, 'Phone must be less than 20 characters').optional().nullable(),
  email: z.string().email('Invalid email format').optional().nullable().or(z.literal('')),
  website: z.string().url('Invalid URL format').optional().nullable().or(z.literal('')),
})

type GymFormData = z.infer<typeof gymSchema>

export const GymTab = () => {
  const { profile, hasGym } = useAuth()
  const updateGymMutation = useUpdateGym()

  // Get gym data for populating the form
  const { data: gymData, isLoading: gymLoading } = useGymData(profile?.gym_id || null)

  // Gym form
  const gymForm = useForm<GymFormData>({
    resolver: zodResolver(gymSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      website: '',
    },
  })

  // Populate form when gym data is available
  useEffect(() => {
    if (gymData) {
      gymForm.reset({
        name: gymData.name || '',
        description: gymData.description || '',
        address: gymData.address || '',
        phone: gymData.phone || '',
        email: gymData.email || '',
        website: gymData.website || '',
      })
    }
  }, [gymData, gymForm])

  // Handle logo change
  const handleLogoChange = async (logoUrl: string | null) => {
    if (!profile?.gym_id) return

    try {
      await updateGymMutation.mutateAsync({
        gymId: profile.gym_id,
        updates: { logo_url: logoUrl },
      })
    } catch {
      toastActions.error('Update Failed', 'Failed to update logo.')
    }
  }

  // Handle gym update
  const handleGymUpdate = async (data: GymFormData) => {
    if (!profile?.gym_id) return

    try {
      await updateGymMutation.mutateAsync({
        gymId: profile.gym_id,
        updates: {
          name: data.name,
          description: data.description || null,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
        },
      })
      toastActions.success('Settings Updated', 'Your settings have been saved successfully.')
    } catch {
      toastActions.error('Update Failed', 'Failed to save settings. Please try again.')
    }
  }

  if (!hasGym) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Setup Yet</h3>
            <p className="text-muted-foreground mb-4">
              Complete your setup to manage settings
            </p>
            <Button>Complete Setup</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>
            Appears on member portal and invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GymLogoUpload
            currentLogoUrl={gymData?.logo_url}
            gymId={profile?.gym_id || ''}
            onLogoChange={handleLogoChange}
            disabled={gymLoading || updateGymMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Details Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Details
          </CardTitle>
          <CardDescription>
            Update your information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={gymForm.handleSubmit(handleGymUpdate)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  placeholder="Enter name"
                  disabled={gymLoading}
                  {...gymForm.register('name')}
                />
                {gymForm.formState.errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {gymForm.formState.errors.name.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Displayed to your members
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description about your fitness center"
                  disabled={gymLoading}
                  rows={3}
                  {...gymForm.register('description')}
                />
                {gymForm.formState.errors.description && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {gymForm.formState.errors.description.message}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Contact Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    disabled={gymLoading}
                    {...gymForm.register('phone')}
                  />
                  {gymForm.formState.errors.phone && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {gymForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@example.com"
                    disabled={gymLoading}
                    {...gymForm.register('email')}
                  />
                  {gymForm.formState.errors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {gymForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.example.com"
                  disabled={gymLoading}
                  {...gymForm.register('website')}
                />
                {gymForm.formState.errors.website && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {gymForm.formState.errors.website.message}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Location</h3>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Textarea
                  id="address"
                  placeholder="Full address including city, state, and pincode"
                  disabled={gymLoading}
                  rows={2}
                  {...gymForm.register('address')}
                />
                {gymForm.formState.errors.address && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {gymForm.formState.errors.address.message}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateGymMutation.isPending || gymLoading}
                className="min-w-[120px]"
              >
                {updateGymMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}