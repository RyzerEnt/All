import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/90 backdrop-blur-md border-b border-white/5 py-4" : "bg-transparent py-6"}`}>
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link href="/" className="block">
            <img src="/logo-color.png" alt="Ryzer" className="h-8 md:h-10 object-contain" />
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80">
              <a href="#features" className="hover:text-primary transition-colors">Features</a>
              <a href="#athletes" className="hover:text-primary transition-colors">Athletes</a>
              <a href="#stats" className="hover:text-primary transition-colors">Performance</a>
            </div>
            <Button className="bg-white text-background hover:bg-white/90 rounded-full px-6 font-bold tracking-tight">
              Get the App
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-nature.png" 
            alt="Trail runner in the mountains" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        </div>
        
        <div className="container relative z-10 mx-auto px-6 md:px-12">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white leading-[1.1] mb-8">
              CONQUER <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">THE PEAK.</span>
            </h1>
            <p className="text-lg md:text-2xl text-white/80 font-light max-w-xl mb-10 leading-relaxed">
              The definitive performance tracker for athletes who push limits outdoors. Built for the mountain, designed for the obsessed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-7 text-lg font-bold shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] transition-all">
                Download Ryzer
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/5 text-white rounded-full px-8 py-7 text-lg font-semibold backdrop-blur-sm">
                Explore Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Numbers Section */}
      <section className="py-24 md:py-32 relative border-t border-white/5 bg-card/30" id="stats">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { label: "Active Athletes", value: "250K+" },
              { label: "Vertical Meters Tracked", value: "14M" },
              { label: "Trails Mapped", value: "50,000" },
              { label: "Pro Teams", value: "12" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-2 border-l-2 border-primary/30 pl-6">
                <span className="text-4xl md:text-5xl font-black text-white">{stat.value}</span>
                <span className="text-sm md:text-base text-white/60 font-medium tracking-wide uppercase">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase 1 */}
      <section className="py-24 md:py-32 relative overflow-hidden" id="features">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
              <img 
                src="/app-ui-mockup.png" 
                alt="Ryzer App UI" 
                className="relative z-10 w-full max-w-sm mx-auto rounded-3xl shadow-2xl border border-white/10"
              />
            </div>
            <div className="order-1 md:order-2 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-bold tracking-wide uppercase">
                Precision Metrics
              </div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                Every meter <br/> accounted for.
              </h2>
              <p className="text-xl text-white/70 font-light leading-relaxed">
                Our proprietary altimeter algorithm filters out noise to give you the most accurate elevation data possible. Because when you're climbing 20% grades, every step matters.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  "Real-time gradient analysis",
                  "Heart rate vs. Elevation overlay",
                  "Nutrition reminders based on effort",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-white/80 font-medium">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Immersive Image Break */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6 md:px-12">
          <div className="relative rounded-[2rem] overflow-hidden aspect-video md:aspect-[21/9]">
            <img 
              src="/trail-runner.png" 
              alt="Runner at dawn" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
              <p className="text-2xl md:text-4xl font-light italic text-white/90 max-w-3xl">
                "Ryzer doesn't just track my runs. It understands the mountain. It's the only app I trust when I'm above 3,000 meters."
              </p>
              <p className="mt-4 text-primary font-bold uppercase tracking-widest text-sm">
                — Sarah Jenkins, UTMB Finisher
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase 2 */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold tracking-wide uppercase">
                Seamless Integration
              </div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                Data that lives <br/> on your wrist.
              </h2>
              <p className="text-xl text-white/70 font-light leading-relaxed">
                Leave your phone in your pack. The Ryzer watch app delivers critical performance metrics exactly when you need them, with zero latency.
              </p>
              <Button variant="link" className="text-primary hover:text-primary/80 p-0 text-lg font-bold group">
                See supported devices 
                <span className="inline-block transition-transform group-hover:translate-x-1 ml-2">→</span>
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full" />
              <img 
                src="/smartwatch-stats.png" 
                alt="Smartwatch interface" 
                className="relative z-10 w-full rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="container relative z-10 mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
            READY TO RISE?
          </h2>
          <p className="text-xl text-white/70 font-light mb-10 max-w-2xl mx-auto">
            Join the thousands of athletes already using Ryzer to push their limits.
          </p>
          <Button size="lg" className="bg-white text-background hover:bg-white/90 rounded-full px-12 py-8 text-xl font-black tracking-tight shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 transition-all duration-300">
            Download Free Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-white/5 py-12 md:py-20">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="col-span-2">
              <img src="/logo-bw.png" alt="Ryzer" className="h-8 object-contain mb-6 opacity-80" />
              <p className="text-sm text-white/50 max-w-sm">
                Built by athletes, for athletes. Ryzer is the premier performance tracking platform for mountain and trail sports.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Product</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Supported Devices</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Release Notes</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Company</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><Link href="/admin" className="hover:text-primary transition-colors">Admin Portal</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-sm text-white/40">
            <p>© {new Date().getFullYear()} Ryzer. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
