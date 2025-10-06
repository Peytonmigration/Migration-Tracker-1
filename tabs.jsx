import { createContext, useContext, useState } from 'react'
const TabsCtx = createContext()
export function Tabs({ defaultValue, children, className='' }){
  const [val, setVal] = useState(defaultValue)
  return <TabsCtx.Provider value={{val, setVal}}><div className={className}>{children}</div></TabsCtx.Provider>
}
export function TabsList({ children, className='' }){ return <div className={`grid gap-2 mb-3 ${className}`}>{children}</div> }
export function TabsTrigger({ value, children }){
  const { val, setVal } = useContext(TabsCtx)
  const active = val===value
  return <button onClick={()=> setVal(value)} className={`btn ${active?'primary':''}`}>{children}</button>
}
export function TabsContent({ value, children }){
  const { val } = useContext(TabsCtx)
  return val===value ? <div>{children}</div> : null
}
