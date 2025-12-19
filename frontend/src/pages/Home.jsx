import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowRight, CheckCircle, ChevronRight } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections(
            (prev) =>
              new Set([
                ...prev,
                entry.target.id || entry.target.dataset.section,
              ])
          );
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    const sections = document.querySelectorAll(
      "[data-animate], [data-section]"
    );
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const styles = `
    * {
      scrollbar-width: thin;
      scrollbar-color: #b11226 #000000;
    }

    *::-webkit-scrollbar {
      height: 8px;
      width: 8px;
    }

    *::-webkit-scrollbar-track {
      background: #000000;
    }

    *::-webkit-scrollbar-thumb {
      background: #b11226;
      border-radius: 4px;
    }

    *::-webkit-scrollbar-thumb:hover {
      background: #dc2626;
    }

    .particle {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }

    @keyframes particleFloat1 {
      0%, 100% {
        transform: translate(0, 0) scale(1);
        opacity: 0.3;
      }
      25% {
        transform: translate(100px, -100px) scale(1.2);
        opacity: 0.6;
      }
      50% {
        transform: translate(200px, -50px) scale(0.8);
        opacity: 0.4;
      }
      75% {
        transform: translate(100px, 50px) scale(1.1);
        opacity: 0.5;
      }
    }

    @keyframes particleFloat2 {
      0%, 100% {
        transform: translate(0, 0) rotate(0deg);
        opacity: 0.4;
      }
      33% {
        transform: translate(-150px, 100px) rotate(120deg);
        opacity: 0.7;
      }
      66% {
        transform: translate(-80px, -120px) rotate(240deg);
        opacity: 0.5;
      }
    }

    @keyframes particleFloat3 {
      0%, 100% {
        transform: translate(0, 0) scale(1);
        opacity: 0.2;
      }
      20% {
        transform: translate(-80px, -80px) scale(1.3);
        opacity: 0.6;
      }
      40% {
        transform: translate(-120px, 40px) scale(0.9);
        opacity: 0.4;
      }
      60% {
        transform: translate(-40px, 120px) scale(1.1);
        opacity: 0.5;
      }
      80% {
        transform: translate(60px, -60px) scale(0.8);
        opacity: 0.3;
      }
    }

    @keyframes flowLine {
      0% {
        stroke-dashoffset: 1000;
        opacity: 0;
      }
      50% {
        opacity: 0.6;
      }
      100% {
        stroke-dashoffset: 0;
        opacity: 0;
      }
    }

    @keyframes pulseGlow {
      0%, 100% {
        filter: blur(40px);
        opacity: 0.3;
      }
      50% {
        filter: blur(60px);
        opacity: 0.6;
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(60px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-40px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInLeft {
      from {
        opacity: 0;
        transform: translateX(-60px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes fadeInRight {
      from {
        opacity: 0;
        transform: translateX(60px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes gradientMove {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }

    @keyframes slideRight {
      from {
        transform: translateX(-20px);
        opacity: 0.5;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes glow {
      0%, 100% {
        box-shadow: 0 0 20px rgba(177, 18, 38, 0.5);
      }
      50% {
        box-shadow: 0 0 40px rgba(177, 18, 38, 0.8);
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-20px);
      }
    }

    .animate-gradientMove {
      background: linear-gradient(-45deg, #000000, #7f0d1b, #b11226, #1a0000, #000000);
      background-size: 400% 400%;
      animation: gradientMove 15s ease infinite;
    }

    .animate-glow {
      animation: glow 2s ease-in-out infinite;
    }

    .animate-float {
      animation: float 6s ease-in-out infinite;
    }

    .scroll-animate {
      opacity: 0;
      transform: translateY(60px) scale(0.95);
      transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), 
                  transform 1s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .scroll-animate.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .scroll-animate-fast {
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), 
                  transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .scroll-animate-fast.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .horizontal-scroll {
      overflow-x: auto;
      overflow-y: hidden;
      white-space: nowrap;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: #b11226 transparent;
    }

    .horizontal-scroll::-webkit-scrollbar {
      height: 6px;
    }

    .horizontal-scroll::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }

    .horizontal-scroll::-webkit-scrollbar-thumb {
      background: #b11226;
      border-radius: 10px;
    }

    .card-3d {
      transform-style: preserve-3d;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .card-3d:hover {
      transform: translateY(-10px) rotateX(5deg) rotateY(5deg);
    }

    .delay-100 { animation-delay: 0.1s; transition-delay: 0.1s; }
    .delay-200 { animation-delay: 0.2s; transition-delay: 0.2s; }
    .delay-300 { animation-delay: 0.3s; transition-delay: 0.3s; }
    .delay-400 { animation-delay: 0.4s; transition-delay: 0.4s; }
    .delay-500 { animation-delay: 0.5s; transition-delay: 0.5s; }
    .delay-600 { animation-delay: 0.6s; transition-delay: 0.6s; }
    .delay-700 { animation-delay: 0.7s; transition-delay: 0.7s; }
    .delay-800 { animation-delay: 0.8s; transition-delay: 0.8s; }
  `;

  const features = [
    {
      emoji: "🎯",
      title: "Real-Time Detection",
      desc: "AI detects emergencies with 98.5% accuracy in under 1 second",
      color: "from-red-600 to-red-800",
    },
    {
      emoji: "🔔",
      title: "Instant Alerts",
      desc: "Immediate notifications sent to emergency contacts with location data",
      color: "from-red-700 to-red-900",
    },
    {
      emoji: "📍",
      title: "Location Tracking",
      desc: "Precise GPS coordinates ensure help arrives exactly where needed",
      color: "from-red-600 to-red-800",
    },
    {
      emoji: "🌐",
      title: "Multi-Zone Coverage",
      desc: "Monitor unlimited locations from a single unified dashboard",
      color: "from-red-700 to-red-900",
    },
    {
      emoji: "🧠",
      title: "Smart Learning",
      desc: "ML algorithms continuously improve accuracy and reduce false alarms",
      color: "from-red-600 to-red-800",
    },
    {
      emoji: "⚡",
      title: "24/7 Monitoring",
      desc: "Never-ending vigilance with real-time analytics and reporting",
      color: "from-red-700 to-red-900",
    },
  ];

  const useCases = [
    {
      emoji: "🏫",
      title: "Schools",
      desc: "Protect students and staff",
      color: "bg-gradient-to-br from-red-600 to-red-900",
    },
    {
      emoji: "🏥",
      title: "Hospitals",
      desc: "Critical patient safety",
      color: "bg-gradient-to-br from-red-700 to-black",
    },
    {
      emoji: "🏢",
      title: "Offices",
      desc: "Secure work environment",
      color: "bg-gradient-to-br from-red-600 to-red-900",
    },
    {
      emoji: "🏛️",
      title: "Public Spaces",
      desc: "Community protection",
      color: "bg-gradient-to-br from-red-700 to-black",
    },
    {
      emoji: "🏠",
      title: "Homes",
      desc: "Family safety first",
      color: "bg-gradient-to-br from-red-600 to-red-900",
    },
    {
      emoji: "🎓",
      title: "Campuses",
      desc: "University-wide coverage",
      color: "bg-gradient-to-br from-red-700 to-black",
    },
  ];


  return (
    <div className="min-h-screen text-white relative overflow-x-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover opacity-60 pointer-events-none z-0"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <style>{styles}</style>
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrollY > 50
            ? "bg-black/95 backdrop-blur-xl border-b border-red-900/30"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-900 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                EchoGuard
              </span>
            </div>
              
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/signin")}
                className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-red-500 transition-all duration-300"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/50"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Overview-style overlays for consistency */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/20 to-black"></div>
        <div className="absolute inset-0 animate-gradientMove opacity-30"></div>

        <div className="relative max-w-6xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-red-950/50 backdrop-blur-sm border border-red-800/50 rounded-full mb-8 animate-glow">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full "></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-semibold text-red-400">
              Live Emergency Monitoring
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-8 leading-[1.1]">
            <span className="block bg-gradient-to-r from-white via-red-200 to-white bg-clip-text text-transparent">
              An AI emergency detection system built with and for safety.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Real-time emergency detection powered by advanced AI. Protect what
            matters most with instant alerts and precise location tracking.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 mb-16">
            <button
              onClick={() => navigate("/signup")}
              className="group px-8 py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-full text-lg font-bold transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/50 flex items-center gap-3"
            >
              Create with EchoGuard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-200" />
            </button>
            <button
              onClick={() => navigate("/signin")}
              className="px-8 py-4 bg-white/5 backdrop-blur-sm border-2 border-red-600/50 hover:border-red-500 text-white rounded-full text-lg font-bold hover:bg-white/10 transition-all duration-200"
            >
              View Demo
            </button>
          </div>

          
        </div>
      </section>

      {/* Main Description with Animated Background */}
      <section
        id="overview"
        className="relative py-32 px-6 overflow-hidden"
        data-section="overview"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/20 to-black"></div>
        <div className="absolute inset-0 animate-gradientMove opacity-30"></div>

        <div
          className={`relative max-w-5xl mx-auto text-center scroll-animate ${
            visibleSections.has("overview") ? "visible" : ""
          }`}
        >
          <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-red-200 to-white bg-clip-text text-transparent">
              An AI emergency detection system built with and for safety.
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-4xl mx-auto">
            Seamlessly monitor environments, detect critical situations, and
            alert emergency contacts using Google's most capable AI models for
            audio pattern recognition and threat assessment.
          </p>
        </div>
      </section>

      {/* Features - Horizontal Scroll Section */}
      <section
        id="features"
        className="relative py-32 px-6 overflow-hidden"
        data-section="features"
      >
        {/* Overview-style overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/20 to-black"></div>
        <div className="absolute inset-0 animate-gradientMove opacity-30"></div>

        <div className="relative max-w-7xl mx-auto">
          <div
            className={`text-center mb-16 scroll-animate ${
              visibleSections.has("features") ? "visible" : ""
            }`}
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-400">
              Scroll to explore our cutting-edge capabilities →
            </p>
          </div>

          <div
            ref={scrollContainerRef}
            className="horizontal-scroll flex gap-6 pb-6 px-4"
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex-none w-80 md:w-96 scroll-animate-fast ${
                  visibleSections.has("features") ? "visible" : ""
                }`}
                style={{
                  transitionDelay: visibleSections.has("features")
                    ? `${index * 0.1}s`
                    : "0s",
                }}
              >
                <div className="h-full p-8 bg-gradient-to-br from-red-950/50 to-black/50 backdrop-blur-sm border border-red-800/30 rounded-3xl hover:border-red-600 hover:shadow-2xl hover:shadow-red-600/20 transition-all duration-500 card-3d group">
                  <div className="text-6xl mb-6 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                    {feature.emoji}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-red-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {feature.desc}
                  </p>
                  <div
                    className={`mt-6 h-1 bg-gradient-to-r ${feature.color} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases - Horizontal Scroll Grid */}
      <section className="relative py-32 px-6 overflow-hidden" data-section="use-cases">
        {/* Overview-style overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/20 to-black"></div>
        <div className="absolute inset-0 animate-gradientMove opacity-30"></div>
        <div className="relative max-w-7xl mx-auto">
          <div
            className={`text-center mb-16 scroll-animate ${
              visibleSections.has("use-cases") ? "visible" : ""
            }`}
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
              See how organizations use EchoGuard
            </h2>
          </div>

          <div className="horizontal-scroll flex gap-6 pb-6 px-4">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className={`flex-none w-72 md:w-80 scroll-animate-fast ${
                  visibleSections.has("use-cases") ? "visible" : ""
                }`}
                style={{
                  transitionDelay: visibleSections.has("use-cases")
                    ? `${index * 0.1}s`
                    : "0s",
                }}
              >
                <div
                  className={`relative aspect-square ${useCase.color} rounded-3xl overflow-hidden group cursor-pointer transform hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-red-600/30`}
                >
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <div className="text-7xl mb-6 transform group-hover:scale-125 transition-transform duration-500">
                      {useCase.emoji}
                    </div>
                    <h3 className="text-3xl font-black text-white mb-3">
                      {useCase.title}
                    </h3>
                    <p className="text-gray-300 text-lg">{useCase.desc}</p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 to-red-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 overflow-hidden border-t border-red-900/30">
        {/* Overview-style overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/20 to-black"></div>
        <div className="absolute inset-0 animate-gradientMove opacity-30"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-900 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                EchoGuard
              </span>
            </div>
            <div className="flex gap-8 text-sm text-gray-400">
              <a
                href="#"
                className="hover:text-red-500 transition-colors duration-300"
              >
                Privacy
              </a>
              <a
                href="#"
                className="hover:text-red-500 transition-colors duration-300"
              >
                Terms
              </a>
              <a
                href="#"
                className="hover:text-red-500 transition-colors duration-300"
              >
                FAQ
              </a>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 EchoGuard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
