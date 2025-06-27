import React from 'react'
import Sujet from './Sujet'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">

      {/* Main Content with Calculator */}
      <main className="container py-12">
        <div className="relative">
          {/* Decorative elements */}
          <div 
            className="absolute -top-10 -left-10 w-64 h-64 rounded-full"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              filter: 'blur(48px)'
            }}
          ></div>
          <div 
            className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full"
            style={{
              background: 'rgba(34, 211, 238, 0.1)',
              filter: 'blur(48px)'
            }}
          ></div>

          {/* Title with gradient underline */}
          <div className="relative z-10 mb-12 text-center">
            <h2 className="font-podkova text-3xl font-bold inline-block">
              Calculateur Demoucron
              <div 
                className="h-1 w-full mt-1"
                style={{ background: 'linear-gradient(to right, var(--blue-600), var(--cyan-500))' }}
              ></div>
            </h2>
          </div>

          {/* Calculator component */}
          <div className="relative z-10">
            <Sujet />
          </div>
        </div>
      </main>

    </div>
  )
}
