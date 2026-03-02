import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, CheckCircle, Zap, Shield, TrendingUp, Users, Award } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const Index = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user && role) {
      navigate("/dashboard");
    }
  }, [user, role, loading, navigate]);

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant exam loading and real-time results",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Bank-level security for your exams",
      gradient: "from-green-400 to-cyan-500"
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description: "Track performance with detailed insights",
      gradient: "from-purple-400 to-pink-500"
    },
    {
      icon: Users,
      title: "Multi-User Support",
      description: "Manage students and examiners easily",
      gradient: "from-blue-400 to-indigo-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 via-teal-100 to-cyan-50 dark:from-cyan-950/30 dark:via-teal-950/30 dark:to-cyan-950/20" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full blur-3xl opacity-30 animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full blur-3xl opacity-30 animate-float delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-300 to-teal-300 rounded-full blur-3xl opacity-15 animate-pulse" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative container mx-auto px-4 py-6 lg:py-8 flex-1 flex flex-col">
          {/* Navigation */}
          <nav className="flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/")}>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-cyan-500/40">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                ExamPro
              </span>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <ThemeToggle />
              <Button 
                variant="ghost" 
                className="hidden sm:flex hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-xl"
                onClick={() => navigate("/auth")}
              >
                {t("common.signIn")}
              </Button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-5xl mx-auto text-center space-y-8 animate-slide-up px-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-default group">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                </span>
                <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  {t("hero.badge")}
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-display font-bold leading-[1.1] tracking-tight">
                <span className="text-foreground">{t("hero.titlePre")}</span>
                <br/>
                <span className="bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-500 bg-clip-text text-transparent animate-gradient-x">
                  {t("hero.titleHighlight")}
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t("hero.description")}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  className="group h-14 px-8 text-lg font-semibold rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white shadow-2xl shadow-cyan-600/40 hover:shadow-3xl hover:shadow-cyan-600/50 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-cyan-500"
                  onClick={() => navigate("/auth")}
                >
                  {t("common.getStarted")}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg font-semibold rounded-2xl border-2 border-cyan-600 dark:border-cyan-500 bg-white dark:bg-gray-900 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 hover:border-cyan-700 dark:hover:border-cyan-400 text-cyan-700 dark:text-cyan-400 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  onClick={() => navigate("/about")}
                >
                  {t("common.learnMore")}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Free forever</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Setup in 2 minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-24 bg-gradient-to-b from-cyan-50/50 to-teal-50/50 dark:from-cyan-950/20 dark:to-teal-950/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              Why Choose <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">ExamPro</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to conduct secure, efficient online examinations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-cyan-300 dark:hover:border-cyan-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2 group-hover:text-cyan-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
            <Award className="h-16 w-16 text-white mx-auto animate-float" />
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-white">
              Ready to Transform Your Exams?
            </h2>
            <p className="text-xl text-cyan-50">
              Join thousands of educators and students using ExamPro for seamless online examinations
            </p>
            <Button
              size="lg"
              className="h-14 px-10 text-lg font-semibold rounded-2xl bg-white text-cyan-600 hover:bg-cyan-50 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 active:scale-95"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
