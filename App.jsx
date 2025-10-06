import React, { useEffect, useState } from 'react'
import MainApp from './MainApp.jsx'
import { Bird } from 'lucide-react'

export default function App(){
  const [showSplash, setShowSplash] = useState(true)
  useEffect(()=>{ const t=setTimeout(()=> setShowSplash(false), 2000); return ()=> clearTimeout(t) },[])
  if(showSplash){
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100">
        <div className="relative w-64 h-64 rounded-full flex items-center justify-center bg-white shadow-md border">
          <img src="/logo.jpg" alt="Migration Tracker Logo" className="w-56 h-56 object-contain rounded-full"/>
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900">Migration Tracker</h1>
        <p className="text-neutral-600 mt-2 text-sm text-center max-w-sm">Real-time migration tracking, hunt logging, and incognito tools for serious waterfowlers.</p>
        <Bird className="mt-4 w-6 h-6 text-neutral-700 animate-pulse" />
      </div>
    )
  }
  return <MainApp/>
}
