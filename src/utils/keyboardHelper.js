/**
 * Utilidades de Teclado para Aplicación POS de Escritorio
 */

// Permite avanzar al siguiente campo con la tecla Enter en un formulario
export const handleEnterAsTab = (e) => {
  if (e.key !== 'Enter') return
  
  const target = e.target
  // No intervenir si es un textarea o si es un botón de submit directo
  if (target.tagName === 'TEXTAREA') return
  if (target.type === 'submit' || target.type === 'button') return

  const form = target.form || target.closest('form') || target.closest('[data-form-container]')
  if (!form) return

  const focusable = Array.from(
    form.querySelectorAll(
      'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([tabindex="-1"])'
    )
  ).filter(el => el.offsetParent !== null) // Solo visibles

  const index = focusable.indexOf(target)
  if (index >= 0 && index < focusable.length - 1) {
    e.preventDefault()
    const next = focusable[index + 1]
    next.focus()
    if (next.select && typeof next.select === 'function') {
      next.select()
    }
  }
}

// Verifica si el foco actual está en algún elemento de entrada de texto
export const isUserTyping = () => {
  const active = document.activeElement
  if (!active) return false
  const tag = active.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active.isContentEditable
}
