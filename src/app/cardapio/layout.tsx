export default function CardapioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
      {children}
    </div>
  )
}