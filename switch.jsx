import { useState } from 'react'
export function Switch({ checked, onCheckedChange, id }){
  const [local, setLocal] = useState(!!checked)
  const onClick = () => { const n = !local; setLocal(n); onCheckedChange && onCheckedChange(n) }
  return <button id={id} onClick={onClick} className={`w-12 h-6 rounded-full border relative ${local?'bg-neutral-900':'bg-white'}`}>
    <span className={`absolute top-0.5 ${local?'left-6':'left-0.5'} w-5 h-5 rounded-full bg-white border transition-all`}/>
  </button>
}
