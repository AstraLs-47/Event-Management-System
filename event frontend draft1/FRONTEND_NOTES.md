# Frontend Quick Notes — React + JS ✅

This short guide highlights the key concepts requested: useState, useEffect, map(), controlled inputs, and how a form triggers a fetch POST.

## 1) useState holds component data (controlled inputs) 🔧
Key idea: keep form values in state and bind inputs to state.

Example (only key parts):
```jsx
// in AddEvent.jsx
const [form, setForm] = useState({ title: '', category: '', date: '', description: '' })

function handleChange(e) {
  const { name, value } = e.target
  setForm(f => ({ ...f, [name]: value })) // update single field
}

// input binding
<input name="title" value={form.title} onChange={handleChange} />
```

Why: controlled inputs make the UI predictable, enable validation, and let React be the single source of truth.

## 2) useEffect fetches API data once on mount (example) 🔁
Key idea: use an effect with an empty dependency array to run a fetch once when the component mounts.

```jsx
useEffect(() => {
  loadEvents() // call existing loadEvents() that fetches events from server
}, []) // [] -> run once on mount
```

(Your project already defines a `loadEvents()` function that performs the GET request.)

## 3) map() renders lists dynamically 🧩
Key idea: turn arrays into JSX lists using `map()`.

Example (key part):
```jsx
// in EventsList.jsx
{filteredEvents.map(event => (
  <div key={event.id} className="event-card-summary"> ... </div>
))}
```

## 4) Form submission -> fetch() POST request (key part) 📬
Key idea: the AddEvent component collects the controlled `form` state and calls a parent handler which performs the POST.

```jsx
// in AddEvent.jsx - submit handler (key part)
function handleSubmit(e) {
  e.preventDefault()
  onAddEvent(form) // send form to parent
}

// in App.jsx - parent receives form and does the POST
async function submitNewEvent(form) {
  const fd = new FormData()
  fd.append('title', form.title)
  // append other fields and file
  await fetch('/api/events/', { method: 'POST', body: fd, credentials: 'include' })
}
```

Tip: only key code parts are shown above (not the entire components).

---

If you'd like, I can also add short unit tests or a code comment checklist to verify these concepts automatically. Want me to add that? 💡