import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import logo from "@/assets/retail-kpi-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <img src={logo} alt="Retail KPI" className="w-20 h-20 mx-auto mb-6 opacity-50" />
        <h1 className="text-6xl font-display font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Button asChild className="gradient-primary">
          <a href="/">
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
