export default function Dashboard() {
  return (
    <section className="bg-surface-container-low py-24 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-[0.2em] mb-4 block">
              Operational Excellence
            </span>
            <h2 className="font-headline-lg text-headline-lg mb-6 leading-tight">Live Network Efficiency</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10">
              Monitor our global operations in real-time. We maintain a 98.4% on-time performance rate, setting the
              industry standard for precision.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="glass-panel p-6 rounded-lg">
                <span className="font-flight-number text-flight-number text-secondary">98.4%</span>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-2 uppercase tracking-wider">
                  On-Time Arrival
                </p>
              </div>
              <div className="glass-panel p-6 rounded-lg">
                <span className="font-flight-number text-flight-number text-secondary">142</span>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-2 uppercase tracking-wider">
                  Direct Routes
                </p>
              </div>
            </div>
          </div>
          <div className="relative h-[400px] rounded-2xl overflow-hidden glass-panel border border-outline/10 shadow-2xl">
            <div className="absolute inset-0 bg-surface-container-highest/20 p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-label-sm text-label-sm">System Live Status</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">UTC 14:32</span>
              </div>
              {/* Mock Data Visualization */}
              <div className="space-y-6">
                <div className="h-1 bg-surface-variant rounded-full relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-secondary w-[85%]"></div>
                </div>
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>LHR - JFK (AL-102)</span>
                  <span className="text-secondary">En Route</span>
                </div>
                <div className="h-1 bg-surface-variant rounded-full relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-secondary w-[32%]"></div>
                </div>
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>HND - SIN (AL-44)</span>
                  <span className="text-secondary">Boarding</span>
                </div>
                <div className="h-1 bg-surface-variant rounded-full relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-secondary w-[60%]"></div>
                </div>
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>DXB - CDG (AL-211)</span>
                  <span className="text-secondary">Cruising</span>
                </div>
              </div>
            </div>
            {/* Abstract Map Background Decoration */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle, #adc6ff 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
}
