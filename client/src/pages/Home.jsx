import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background text-text-main overflow-x-hidden selection:bg-secondary selection:text-background">
      
      {/* ================= NAVBAR ================= */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto border-b border-gray-800/50 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_10px_#00ff9d]"></div>
            <span className="text-2xl font-bold tracking-wider text-text-main">CollabX<span className="text-secondary">.</span></span>
        </div>
        <div className="flex gap-4">
           <button onClick={() => navigate("/login")} className="text-text-muted hover:text-text-main font-medium transition-colors">Log In</button>
           <button onClick={() => navigate("/register")} className="px-5 py-2 rounded border border-secondary/30 text-secondary hover:bg-secondary/10 transition-all">Sign Up</button>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <header className="flex flex-col items-center justify-center text-center mt-20 px-4 relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-bold tracking-widest text-secondary uppercase bg-secondary/5 rounded-full border border-secondary/20 shadow-[0_0_15px_rgba(0,255,157,0.1)]">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          System Operational • v3.0 Stable
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Where <span className="text-white">Teams</span> Build <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-white to-primary">
            The Future.
          </span>
        </h1>
        
        <p className="max-w-2xl text-lg text-text-muted mb-10 leading-relaxed">
           An enterprise-grade workspace featuring <span className="text-white">Horizontal Scaling</span>, 
           <span className="text-white"> AI Summaries</span>, and 
           <span className="text-white"> Military-Grade Security</span>. 
           Organize your dev chaos into structured Workspaces.
        </p>
        
        <div className="flex gap-4">
          <button 
            onClick={() => navigate("/register")}
            className="px-8 py-4 bg-secondary text-background font-bold rounded-lg shadow-[0_0_20px_rgba(0,255,157,0.4)] hover:shadow-[0_0_30px_rgba(0,255,157,0.6)] hover:scale-105 transition-all"
          >
            Create Workspace
          </button>
          <button 
            onClick={() => navigate("/login")}
            className="px-8 py-4 bg-surface text-text-main font-medium rounded-lg border border-gray-700 hover:border-secondary/50 transition-colors"
          >
            View Live Demo
          </button>
        </div>
      </header>

      {/* ================= NEW: PRODUCT OVERVIEW (The "Jira" Style Section) ================= */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Organize Your Workflow</h2>
            <p className="text-text-muted">A hierarchical structure designed for clarity.</p>
        </div>

        <div className="relative bg-surface border border-gray-800 rounded-xl p-4 md:p-8 shadow-2xl overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>

            {/* THE UI MOCKUP (Visualizing Workspace -> Channel -> Chat) */}
            <div className="relative grid grid-cols-12 gap-4 h-[400px] rounded-lg overflow-hidden border border-gray-800 bg-background/50 backdrop-blur-sm">
                
                {/* 1. WORKSPACE BAR (Leftmost) */}
                <div className="col-span-2 md:col-span-1 bg-[#0b0c10] border-r border-gray-800 flex flex-col items-center py-4 gap-4">
                    {/* Active Workspace */}
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-background font-bold shadow-[0_0_10px_rgba(0,212,255,0.5)] cursor-pointer hover:scale-110 transition">C</div>
                    {/* Inactive */}
                    <div className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 transition cursor-pointer"></div>
                    <div className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 transition cursor-pointer"></div>
                    <div className="mt-auto w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-500">+</div>
                </div>

                {/* 2. CHANNEL LIST (Middle) */}
                <div className="col-span-3 hidden md:block bg-surface/50 border-r border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-6">
                        <span className="font-bold text-sm text-text-main">CollabX Dev</span>
                        <span className="text-gray-500 text-xs">▼</span>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Channels</p>
                            <div className="space-y-1">
                                <div className="px-2 py-1 bg-primary/10 text-primary rounded text-sm cursor-pointer border-l-2 border-primary"># general</div>
                                <div className="px-2 py-1 text-text-muted hover:bg-gray-800/50 rounded text-sm cursor-pointer"># backend-api</div>
                                <div className="px-2 py-1 text-text-muted hover:bg-gray-800/50 rounded text-sm cursor-pointer"># deployments</div>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Direct Messages</p>
                            <div className="flex items-center gap-2 px-2 py-1">
                                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                <span className="text-sm text-text-muted">Utkarsh (You)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. CHAT AREA (Right) */}
                <div className="col-span-10 md:col-span-8 bg-background p-6 flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-text-main"># general</span>
                            <span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">Redis + Socket.io</span>
                        </div>
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gray-700 border border-black"></div>
                            <div className="w-6 h-6 rounded-full bg-gray-600 border border-black"></div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 space-y-4">
                        {/* Msg 1 */}
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">AI</div>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-purple-400 text-sm">Gemini Bot</span>
                                    <span className="text-[10px] text-gray-600">10:42 AM</span>
                                </div>
                                <p className="text-sm text-text-muted bg-surface/50 p-2 rounded-lg border border-gray-800 mt-1">
                                    I've analyzed the server logs. No anomalies detected. System is running at 99.9% uptime.
                                </p>
                            </div>
                        </div>
                        {/* Msg 2 */}
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded bg-secondary/20 flex items-center justify-center text-secondary text-xs font-bold">U</div>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-secondary text-sm">Utkarsh</span>
                                    <span className="text-[10px] text-gray-600">10:45 AM</span>
                                </div>
                                <p className="text-sm text-text-main mt-1">
                                    Great! I'm pushing the new WebRTC update now.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="mt-auto pt-4">
                        <div className="h-10 bg-surface border border-gray-700 rounded-lg flex items-center px-3 text-sm text-gray-500">
                            Message #general...
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* ================= SECURITY SECTION (More Details added) ================= */}
      <section className="py-24 bg-[#15171c] border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <div className="inline-block px-3 py-1 mb-4 text-xs font-bold text-red-400 bg-red-400/10 rounded-full border border-red-400/20">
                    ENTERPRISE SECURITY
                </div>
                <h2 className="text-3xl font-bold mb-4">Zero Trust Architecture</h2>
                <p className="text-text-muted max-w-2xl mx-auto">
                    Security isn't an afterthought. It's baked into every request, socket event, and database query.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                
                {/* Visual Terminal */}
                <div className="bg-black border border-gray-800 rounded-xl p-6 font-mono text-xs relative shadow-2xl">
                    <div className="flex gap-2 mb-4 border-b border-gray-800 pb-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="space-y-2 opacity-90">
                        <p className="text-gray-500"># Initializing Security Protocols...</p>
                        <p className="text-green-400">✓ Middleware: RateLimiter [Active]</p>
                        <p className="text-green-400">✓ Middleware: Helmet.js [Active]</p>
                        <p className="text-green-400">✓ Middleware: XSS-Clean [Active]</p>
                        <p className="text-gray-500 mt-4"># Monitoring Incoming Traffic...</p>
                        <p className="text-blue-400">ℹ [INFO] User 192.168.1.42 connected via WSS</p>
                        <p className="text-red-500 animate-pulse bg-red-900/10 p-1">⚠ [ALERT] DDoS Attempt Detected from 45.22.11.00</p>
                        <p className="text-red-400"> Action: BLOCKED (Limit 50req/min exceeded)</p>
                    </div>
                </div>

                {/* Detailed Security Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* Item 1 */}
                    <div className="p-4 border border-gray-800 rounded-lg bg-surface hover:border-red-500/50 transition duration-300">
                        <div className="text-red-500 text-xl mb-2">🛡️</div>
                        <h4 className="font-bold text-white mb-1">DDoS Guard</h4>
                        <p className="text-text-muted text-xs">Redis-based sliding window rate limiting. Blocks IPs automatically after 50 requests/min.</p>
                    </div>

                    {/* Item 2 */}
                    <div className="p-4 border border-gray-800 rounded-lg bg-surface hover:border-blue-500/50 transition duration-300">
                        <div className="text-blue-500 text-xl mb-2">🔑</div>
                        <h4 className="font-bold text-white mb-1">JWT + Cookies</h4>
                        <p className="text-text-muted text-xs">HttpOnly cookies prevent XSS attacks. Access tokens rotate automatically.</p>
                    </div>

                    {/* Item 3 */}
                    <div className="p-4 border border-gray-800 rounded-lg bg-surface hover:border-yellow-500/50 transition duration-300">
                        <div className="text-yellow-500 text-xl mb-2">🔒</div>
                        <h4 className="font-bold text-white mb-1">Socket Auth</h4>
                        <p className="text-text-muted text-xs">Strict Handshake validation. Connection rejected without valid session token.</p>
                    </div>

                    {/* Item 4 */}
                    <div className="p-4 border border-gray-800 rounded-lg bg-surface hover:border-purple-500/50 transition duration-300">
                        <div className="text-purple-500 text-xl mb-2">🧼</div>
                        <h4 className="font-bold text-white mb-1">Data Sanitization</h4>
                        <p className="text-text-muted text-xs">MongoDB query injection protection and HTML sanitization on all inputs.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* ================= ARCHITECTURE SECTION (UPDATED: Connected Flow) ================= */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Under the Hood</h2>
            <p className="text-text-muted">High-performance Event Pipeline</p>
        </div>

        {/* Outer Container with Glow */}
        <div className="relative bg-surface border border-gray-800 rounded-xl p-8 md:p-16 shadow-2xl overflow-hidden">
             
             {/* Background Glow Effect */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>

             <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
                
                {/* NODE 1: CLIENT */}
                <div className="relative group z-10 w-full md:w-auto">
                    <div className="flex flex-col items-center justify-center p-6 border border-gray-700 bg-background rounded-lg shadow-lg min-w-[180px] hover:border-primary/50 transition-colors">
                        <span className="text-4xl mb-3">💻</span>
                        <h3 className="font-bold text-white">Client</h3>
                        <p className="text-xs text-text-muted">React + Redux</p>
                    </div>
                    {/* User IP Badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0b0c10] border border-gray-700 text-[10px] text-gray-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                        User IP: 127.0.0.1
                    </div>
                </div>

                {/* CONNECTOR 1: WITH SECURITY CHECK */}
                <div className="hidden md:flex flex-1 h-0.5 bg-gray-700 relative items-center justify-center mx-4">
                    {/* The Line */}
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-primary/50 to-gray-700 opacity-50"></div>
                    {/* The Badge on the line */}
                    <div className="bg-[#1a1a1a] border border-red-500/50 text-red-400 text-[10px] font-bold px-3 py-1 rounded-full z-20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                        🛡️ Rate Limit Check
                    </div>
                </div>
                {/* Mobile Connector (Vertical Arrow) */}
                <div className="md:hidden h-8 w-0.5 bg-gray-700"></div>

                {/* NODE 2: SERVER CLUSTER */}
                <div className="relative group z-10 w-full md:w-auto">
                    <div className="flex flex-col items-center justify-center p-6 border border-primary/50 bg-background rounded-lg shadow-[0_0_20px_rgba(0,212,255,0.15)] min-w-[200px]">
                        <span className="text-4xl mb-3">⚙️</span>
                        <h3 className="font-bold text-white">Node Cluster</h3>
                        <p className="text-xs text-text-muted">Socket.io + Express</p>
                    </div>
                    {/* Load Balancer Badge */}
                    <div className="absolute -top-3 right-4 bg-primary text-black text-[9px] font-bold px-2 py-0.5 rounded shadow-[0_0_10px_rgba(0,212,255,0.6)]">
                        LOAD BALANCED
                    </div>
                </div>

                {/* CONNECTOR 2: SIMPLE PIPE */}
                <div className="hidden md:flex flex-1 h-0.5 bg-gray-700 relative mx-4">
                     <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-secondary/50 to-gray-700 opacity-50"></div>
                </div>
                {/* Mobile Connector */}
                <div className="md:hidden h-8 w-0.5 bg-gray-700"></div>

                {/* NODE 3: DATABASE LAYER */}
                <div className="relative group z-10 w-full md:w-auto">
                    <div className="flex flex-col items-center justify-center p-6 border border-gray-700 bg-background rounded-lg shadow-lg min-w-[180px] hover:border-secondary/50 transition-colors">
                        <div className="flex gap-4 mb-2">
                            <span className="text-2xl" title="Redis">🚀</span>
                            <div className="w-px bg-gray-700 h-8"></div>
                            <span className="text-2xl" title="MongoDB">🗄️</span>
                        </div>
                        <h3 className="font-bold text-white">Data Layer</h3>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] text-secondary">Redis</span>
                            <span className="text-[10px] text-gray-500">•</span>
                            <span className="text-[10px] text-yellow-500">Mongo</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-gray-800 bg-[#0b0c10] py-12 text-center">
        <h2 className="text-2xl font-bold text-text-main tracking-widest mb-4">CollabX<span className="text-secondary">.</span></h2>
        <div className="flex justify-center gap-6 text-sm text-text-muted mb-8">
            <a href="#" className="hover:text-white transition">Status</a>
            <a href="#" className="hover:text-white transition">API Docs</a>
            <a href="#" className="hover:text-white transition">Security</a>
        </div>
        <p className="text-gray-600 text-xs">© 2026 Utkarsh. Built for Scale.</p>
      </footer>

    </div>
  );
}