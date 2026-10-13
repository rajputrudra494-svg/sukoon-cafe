// Booking goes straight to the café's WhatsApp with a ready-written message.
// No backend, nothing stored — the guest just presses send.
const PHONE = '919355255294'

const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())

function to12h(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`
}

export function initReserve(form) {
  const times = form.querySelector('[data-times]')
  const date = form.elements.date
  const out = form.querySelector('[data-guests]')
  const err = form.querySelector('[data-form-error]')
  let guests = 2

  // last seating half an hour before close
  for (let mins = 12 * 60; mins <= 22 * 60 + 30; mins += 30) {
    const v = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
    times.add(new Option(to12h(v), v, false, v === '20:00'))
  }
  date.min = todayIST()
  date.value = todayIST()

  form.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    guests = Math.min(30, Math.max(1, guests + Number(b.dataset.step)))
    out.textContent = guests
  }))

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    err.textContent = ''
    form.querySelectorAll('.is-invalid').forEach((f) => f.classList.remove('is-invalid'))

    const name = form.elements.name.value.trim()
    const problems = []
    if (!name) problems.push(form.elements.name)
    if (!date.value || date.value < date.min) problems.push(date)
    if (problems.length) {
      problems.forEach((el) => el.closest('.field').classList.add('is-invalid'))
      err.textContent = !name ? 'We need a name to put on the table.' : 'That date has already gone by.'
      problems[0].focus()
      return
    }

    const nice = new Date(date.value + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    const occasion = form.elements.occasion.value
    const note = form.elements.note.value.trim()
    const lines = [
      'Hi Sukoon! I’d like to reserve a table.',
      '',
      `Name: ${name}`,
      `When: ${nice}, ${to12h(times.value)}`,
      `Guests: ${guests}`,
      occasion !== 'Just because' ? `Occasion: ${occasion}` : '',
      note ? `Note: ${note}` : '',
    ].filter((l, i) => l || i === 1)

    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener')
  })
}
