import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from '@uploadthing/react'
import type { RFYFileRouter } from './uploadthing'

export const UploadButton = generateUploadButton<RFYFileRouter>()
export const UploadDropzone = generateUploadDropzone<RFYFileRouter>()
export const { useUploadThing } = generateReactHelpers<RFYFileRouter>()
