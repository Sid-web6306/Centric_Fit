'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'
import { toastActions } from '@/stores/toast-store'
import { validateImageFile, generateAvatarFilename } from '@/lib/avatar-utils'
import { logger } from '@/lib/logger'

interface GymLogoUploadProps {
    currentLogoUrl?: string | null
    gymId: string
    onLogoChange: (url: string | null) => void
    disabled?: boolean
    className?: string
}

export function GymLogoUpload({
    currentLogoUrl,
    gymId,
    onLogoChange,
    disabled = false,
    className
}: GymLogoUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    // Cleanup URLs on unmount
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])

    const extractPathFromStorageUrl = (url: string): string | null => {
        try {
            const urlParts = url.split('/storage/v1/object/public/fitness_logo/')
            if (urlParts.length === 2) {
                return decodeURIComponent(urlParts[1])
            }
            return null
        } catch {
            return null
        }
    }

    const deleteOldLogo = async (logoUrl: string | null): Promise<void> => {
        if (!logoUrl) return

        try {
            const filePath = extractPathFromStorageUrl(logoUrl)
            if (!filePath) return

            const { error } = await supabase.storage
                .from('fitness_logo')
                .remove([filePath])

            if (error) {
                logger.warn('Failed to delete old logo:', { error: error.message })
            }
        } catch (error) {
            logger.warn('Error during logo cleanup:', { error })
        }
    }

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file
        const validation = validateImageFile(file)
        if (!validation.isValid) {
            toastActions.error('Invalid File', validation.error || 'Please select a valid image.')
            return
        }

        // Reset input
        if (event.target) event.target.value = ''

        try {
            setUploading(true)

            // Create preview
            const preview = URL.createObjectURL(file)
            setPreviewUrl(preview)

            // Clean up old logo
            if (currentLogoUrl) {
                await deleteOldLogo(currentLogoUrl)
            }

            // Generate filename and path: {gymId}/logo/{filename}
            const fileName = generateAvatarFilename(gymId, file.name)
            const filePath = `${gymId}/logo/${fileName}`

            // Upload to fitness_logo bucket
            const { error } = await supabase.storage
                .from('fitness_logo')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (error) {
                toastActions.error('Upload Failed', error.message)
                setPreviewUrl(null)
                return
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('fitness_logo')
                .getPublicUrl(filePath)

            onLogoChange(publicUrl)
            setPreviewUrl(null)

        } catch (error) {
            logger.error('Logo upload error:', { error })
            toastActions.error('Upload Failed', 'An unexpected error occurred.')
            setPreviewUrl(null)
        } finally {
            setUploading(false)
        }
    }

    const removeLogo = async () => {
        try {
            setUploading(true)

            if (currentLogoUrl) {
                await deleteOldLogo(currentLogoUrl)
            }

            onLogoChange(null)
        } catch (error) {
            logger.error('Logo removal error:', { error })
            toastActions.error('Remove Failed', 'Failed to remove logo.')
        } finally {
            setUploading(false)
        }
    }

    const displayLogoUrl = previewUrl || currentLogoUrl

    return (
        <div className={cn('flex flex-col items-center space-y-4', className)}>
            {/* Logo Display */}
            <div className="relative group">
                <div
                    className={cn(
                        'w-32 h-32 rounded-lg border-2 border-dashed border-border',
                        'flex items-center justify-center bg-muted/50 overflow-hidden',
                        'transition-colors hover:border-primary/50'
                    )}
                >
                    {displayLogoUrl ? (
                        <Image
                            src={displayLogoUrl}
                            alt="Logo"
                            width={128}
                            height={128}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="text-center p-4">
                            <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground">No logo</span>
                        </div>
                    )}

                    {/* Upload Overlay */}
                    <div
                        className={cn(
                            'absolute inset-0 flex items-center justify-center rounded-lg',
                            'bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity',
                            uploading && 'opacity-100'
                        )}
                    >
                        {uploading ? (
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                            <Camera className="h-6 w-6 text-white" />
                        )}
                    </div>

                    {/* Clickable Overlay */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || disabled}
                        className="absolute inset-0 cursor-pointer"
                        aria-label="Upload logo"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || disabled}
                    size="sm"
                    variant="outline"
                >
                    <Upload className="h-4 w-4 mr-2" />
                    {currentLogoUrl ? 'Change' : 'Upload'}
                </Button>

                {currentLogoUrl && (
                    <Button
                        type="button"
                        onClick={removeLogo}
                        disabled={uploading || disabled}
                        size="sm"
                        variant="outline"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                    </Button>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading || disabled}
            />

            {/* Guidelines */}
            <p className="text-xs text-muted-foreground text-center">
                JPG, PNG or WebP. Max 2MB.
            </p>
        </div>
    )
}
