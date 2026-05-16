import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { FormBuilderEditor } from '@/components/admin/forms/FormBuilderEditor'

export default async function EditFormPage({ params }: { params: { id: string } }) {
  const form = await db.form.findUnique({
    where: { id: params.id },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  if (!form) notFound()

  return (
    <FormBuilderEditor
      mode="edit"
      initialData={{
        id: form.id,
        title: form.title,
        description: form.description,
        slug: form.slug,
        notifyEmail: form.notifyEmail,
        redirectUrl: form.redirectUrl,
        isActive: form.isActive,
        fields: form.fields.map((f) => ({
          id: f.id,
          label: f.label,
          type: f.type,
          placeholder: f.placeholder ?? undefined,
          required: f.required,
          options: (f.options as string[] | null) ?? undefined,
          order: f.order,
        })),
      }}
    />
  )
}
