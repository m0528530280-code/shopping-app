export default function QtyStepper({ value, onChange }) {
  const qty = value || 1
  return (
    <div className="qty-stepper">
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        disabled={qty <= 1}
      >−</button>
      <span>{qty}</span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
      >+</button>
    </div>
  )
}
