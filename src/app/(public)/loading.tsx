export default function Loading() {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-8 h-8 border-2 animate-spin"
          style={{
            borderColor: 'rgba(139,0,0,0.2)',
            borderTopColor: '#8B0000',
            borderRadius: '50%',
          }}
        />
        <p className="label-text opacity-40">Loading</p>
      </div>
    </div>
  )
}
