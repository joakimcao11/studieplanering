import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, ArrowRight, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import lthLogo from '@/assets/lth-logo.png';

const Home = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <img src={lthLogo} alt="LTH" className="h-9 w-auto" />
          <div>
            <p className="font-bold leading-tight">Studieplaneringsverktyg</p>
            <p className="text-xs text-muted-foreground">Lunds Tekniska Högskola</p>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">Välkommen – vem är du?</h1>
            <p className="text-muted-foreground">
              Välj hur du vill använda studieplaneringsverktyget.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Link to="/student" className="group">
              <div className="h-full border rounded-xl p-8 bg-card hover:border-primary hover:shadow-lg transition-all flex flex-col">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <GraduationCap className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Jag är LTH-student</h2>
                <p className="text-sm text-muted-foreground flex-1">
                  Skapa din egen studieplanering – lägg till kurser per termin och läsperiod,
                  se en sammanställning och exportera som Word, PDF eller text.
                </p>
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 my-4 w-fit">
                  <Unlock className="w-3.5 h-3.5" /> Ingen inloggning krävs
                </div>
                <Button className="w-full group-hover:translate-x-0.5 transition-transform">
                  Till studentens studieplanering <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Link>

            <Link to="/svl" className="group">
              <div className="h-full border rounded-xl p-8 bg-card hover:border-primary hover:shadow-lg transition-all flex flex-col">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Jag är studievägledare</h2>
                <p className="text-sm text-muted-foreground flex-1">
                  Vägledarsidan med mötesanteckningar, studieplanering, AI-stöd,
                  dokumentmallar och administration av program och kurser.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted border rounded px-2 py-1 my-4 w-fit">
                  <Lock className="w-3.5 h-3.5" /> Inloggning krävs
                </div>
                <Button variant="outline" className="w-full group-hover:translate-x-0.5 transition-transform">
                  Till vägledarsidan <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Studieplaneringsverktyg · Studie- och karriärvägledningen, LTH
      </footer>
    </div>
  );
};

export default Home;
