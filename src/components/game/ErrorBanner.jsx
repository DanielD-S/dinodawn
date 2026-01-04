export default function ErrorBanner({ error, onClose, disabled }) {
  if (!error) return null
  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        background: "#ffe9e9",
      }}
    >
      <b style={{ color: "crimson" }}>Error:</b> {error}{" "}
      <button style={{ marginLeft: 10 }} onClick={onClose} disabled={disabled}>
        Cerrar
      </button>
    </div>
  )
}
