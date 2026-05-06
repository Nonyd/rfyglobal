import { createRouteHandler } from 'uploadthing/next'
import { rfyFileRouter } from '@/lib/uploadthing'

export const { GET, POST } = createRouteHandler({ router: rfyFileRouter })
