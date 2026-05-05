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
            <img src="/logo-color.png" alt="Ryzer" className="h-8 md:h-10 object-contain rounded-xl" />
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80">
              <a href="#features" className="hover:text-primary transition-colors">Fonctionnalites</a>
              <a href="#athletes" className="hover:text-primary transition-colors">Athletes</a>
              <a href="#stats" className="hover:text-primary transition-colors">Performance</a>
            </div>
            <Button className="bg-white text-background hover:bg-white/90 rounded-full px-6 font-bold tracking-tight">
              Telecharger
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-nature.png"
            alt="Coureur de trail en montagne"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        </div>

        <div className="container relative z-10 mx-auto px-6 md:px-12">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white leading-[1.1] mb-8">
              CONQUIERS <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">LE SOMMET.</span>
            </h1>
            <p className="text-lg md:text-2xl text-white/80 font-light max-w-xl mb-10 leading-relaxed">
              Le tracker de performance definitif pour les athletes qui repoussent leurs limites en plein air. Concu pour la montagne, pense pour les passionnes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-7 text-lg font-bold shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] transition-all">
                Telecharger Ryzer
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/5 text-white rounded-full px-8 py-7 text-lg font-semibold backdrop-blur-sm">
                Decouvrir les fonctionnalites
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
              { label: "Athletes actifs", value: "250K+" },
              { label: "Metres de denivele enregistres", value: "14M" },
              { label: "Sentiers cartographies", value: "50 000" },
              { label: "Equipes professionnelles", value: "12" },
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
                alt="Interface de l'application Ryzer"
                className="relative z-10 w-full max-w-sm mx-auto rounded-3xl shadow-2xl border border-white/10"
              />
            </div>
            <div className="order-1 md:order-2 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-bold tracking-wide uppercase">
                Metriques de precision
              </div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                Chaque metre <br/> compte.
              </h2>
              <p className="text-xl text-white/70 font-light leading-relaxed">
                Notre algorithme altimetrique proprietary filtre le bruit pour vous offrir les donnees d'elevation les plus precises. Parce que sur une pente a 20%, chaque pas compte.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  "Analyse du gradient en temps reel",
                  "Superposition frequence cardiaque / altitude",
                  "Rappels nutritionnels bases sur l'effort",
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
      <section className="py-24 relative" id="athletes">
        <div className="container mx-auto px-6 md:px-12">
          <div className="relative rounded-[2rem] overflow-hidden aspect-video md:aspect-[21/9]">
            <img
              src="/trail-runner.png"
              alt="Coureur a l'aube"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
              <p className="text-2xl md:text-4xl font-light italic text-white/90 max-w-3xl">
                "Ryzer ne se contente pas de suivre mes sorties. Il comprend la montagne. C'est la seule appli en laquelle j'ai confiance au-dessus de 3 000 metres."
              </p>
              <p className="mt-4 text-primary font-bold uppercase tracking-widest text-sm">
                — Sarah Jenkins, Finaliste UTMB
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
                Integration seamless
              </div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                Vos donnees <br/> sur votre poignet.
              </h2>
              <p className="text-xl text-white/70 font-light leading-relaxed">
                Laissez votre telephone dans votre sac. L'appli montre Ryzer vous livre les metriques de performance essentielles au bon moment, sans latence.
              </p>
              <Button variant="link" className="text-primary hover:text-primary/80 p-0 text-lg font-bold group">
                Voir les appareils compatibles
                <span className="inline-block transition-transform group-hover:translate-x-1 ml-2">→</span>
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full" />
              <img
                src="/smartwatch-stats.png"
                alt="Interface montre connectee"
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
            PRET A DEPASSER TES LIMITES ?
          </h2>
          <p className="text-xl text-white/70 font-light mb-10 max-w-2xl mx-auto">
            Rejoins les milliers d'athletes qui utilisent deja Ryzer pour se surpasser chaque jour.
          </p>
          <Button size="lg" className="bg-white text-background hover:bg-white/90 rounded-full px-12 py-8 text-xl font-black tracking-tight shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 transition-all duration-300">
            Telecharger gratuitement
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-white/5 py-12 md:py-20">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="col-span-2">
              <img src="/logo-bw.png" alt="Ryzer" className="h-8 object-contain mb-6 opacity-80 rounded-xl" />
              <p className="text-sm text-white/50 max-w-sm">
                Cree par des athletes, pour des athletes. Ryzer est la plateforme de suivi de performance de reference pour les sports de montagne et de trail.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Produit</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li><a href="#" className="hover:text-primary transition-colors">Fonctionnalites</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Appareils compatibles</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Notes de mise a jour</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Entreprise</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li><a href="#" className="hover:text-primary transition-colors">A propos</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Recrutement</a></li>
                <li><Link href="/admin" className="hover:text-primary transition-colors">Portail admin</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-sm text-white/40">
            <p>© {new Date().getFullYear()} Ryzer. Tous droits reserves.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Politique de confidentialite</a>
              <a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
