import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useNavigate, Link } from 'react-router-dom';
import { Car, ShieldCheck, Star, Phone, Mail, MapPin, ArrowRight, Gauge, CheckCircle, Ship, Award, Users, Search, RefreshCw, Layers } from 'lucide-react';
import { useDataStore, toast } from '@/store';

export default function Landing() {
  const navigate = useNavigate();
  const { vehicleModels, makeModels } = useDataStore();

  // Loading / Preloader State
  const [loading, setLoading] = useState(true);

  // Scroll state for Navbar
  const [scrolled, setScrolled] = useState(false);

  // Mouse tracking state for custom cursor and parallax background
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!cursorVisible) setCursorVisible(true);
    };
    
    window.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('mouseleave', () => setCursorVisible(false));
    document.addEventListener('mouseenter', () => setCursorVisible(true));

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, [cursorVisible]);

  const getParallaxOffset = (depth: number) => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const moveX = ((mousePos.x - centerX) / centerX) * depth;
    const moveY = ((mousePos.y - centerY) / centerY) * depth;
    return { x: moveX, y: moveY };
  };

  // Form & Filter state
  const [inquiry, setInquiry] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  // Search filter states
  const [filterMake, setFilterMake] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCondition, setFilterCondition] = useState('');

  // Typing animation text state
  const [typedText, setTypedText] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const phrases = [
    "Discover Luxury Import Cars.",
    "Trust & Transformed Logistics.",
    "Find Your Dream Vehicle."
  ];

  // Typing Animation Effect
  useEffect(() => {
    if (loading) return;
    const currentPhrase = phrases[phraseIdx];
    let timer: NodeJS.Timeout;

    if (isDeleting) {
      timer = setTimeout(() => {
        setTypedText(currentPhrase.substring(0, charIdx - 1));
        setCharIdx(prev => prev - 1);
      }, 50);
    } else {
      timer = setTimeout(() => {
        setTypedText(currentPhrase.substring(0, charIdx + 1));
        setCharIdx(prev => prev + 1);
      }, 100);
    }

    if (!isDeleting && charIdx === currentPhrase.length) {
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && charIdx === 0) {
      setIsDeleting(false);
      setPhraseIdx(prev => (prev + 1) % phrases.length);
    }

    return () => clearTimeout(timer);
  }, [charIdx, isDeleting, phraseIdx, loading]);

  // Preloader Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // 3D Cylinder Carousel State & Auto-Rotate
  const [carouselIdx, setCarouselIdx] = useState(0);
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setCarouselIdx(prev => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(interval);
  }, [loading]);

  // Scroll event for Navbar background color change
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for Animate-On-Scroll (AOS) equivalent
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    }, { threshold: 0.15 });

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      sectionRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [loading]);

  // Populate makes and years dynamically for filters
  const availableMakes = Array.from(new Set(makeModels.map(m => m.name)));
  const availableYears = Array.from(new Set(vehicleModels.map(v => v.year))).sort((a,b) => b-a);

  // Filter Logic
  const filteredVehicles = vehicleModels.map(v => {
    const make = makeModels.find(m => m.id === v.makeModelId);
    return { ...v, makeName: make?.name || '' };
  }).filter(v => {
    const matchMake = !filterMake || v.makeName.toLowerCase() === filterMake.toLowerCase();
    const matchModel = !filterModel || v.name.toLowerCase().includes(filterModel.toLowerCase());
    const matchYear = !filterYear || v.year.toString() === filterYear;
    
    // Condition mapping: Year >= 2024 is Brand New, else Reconditioned
    const condition = v.year >= 2024 ? 'Brand New' : 'Reconditioned';
    const matchCondition = !filterCondition || condition.toLowerCase() === filterCondition.toLowerCase();

    return matchMake && matchModel && matchYear && matchCondition;
  });

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost/Automobile/backend/api/leads.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiry)
      });
      if (!res.ok) throw new Error('Submission failed');
      
      Swal.fire({
        title: 'Inquiry Submitted!',
        text: 'Thank you for reaching out. Our team will contact you shortly.',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        background: '#0f172a',
        color: '#f8fafc'
      });
      
      setInquiry({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      Swal.fire({
        title: 'Submission Failed',
        text: 'Failed to send inquiry. Please check your connection and try again.',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
        background: '#0f172a',
        color: '#f8fafc'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterMake('');
    setFilterModel('');
    setFilterYear('');
    setFilterCondition('');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans">
        {/* Preloader Silhouette/Spinning Wheel Animation */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-red-600 border-l-transparent animate-spin" />
          <div className="absolute w-28 h-28 rounded-full border-2 border-dashed border-slate-800 animate-spin-slow" />
          <Car className="w-14 h-14 text-white drop-shadow-[0_0_15px_rgba(37,99,235,0.8)] animate-pulse" />
        </div>
        <h2 className="mt-8 text-xl font-bold tracking-widest text-slate-100 uppercase">D&N AUTOMART</h2>
        <p className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Premium Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* Background Neon Glows with React Parallax Animation */}
      <div 
        className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none transition-transform duration-700 ease-out" 
        style={{ transform: `translate(${getParallaxOffset(-40).x}px, ${getParallaxOffset(-40).y}px)` }}
      />
      <div 
        className="absolute top-[20%] right-1/4 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[140px] pointer-events-none transition-transform duration-1000 ease-out" 
        style={{ transform: `translate(${getParallaxOffset(50).x}px, ${getParallaxOffset(50).y}px)` }}
      />
      <div 
        className="absolute bottom-[25%] left-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none transition-transform duration-1000 ease-out" 
        style={{ transform: `translate(${getParallaxOffset(-30).x}px, ${getParallaxOffset(-30).y}px)` }}
      />

      {/* Custom Animated Mouse Pointer */}
      {cursorVisible && (
        <>
          <div 
            className="fixed w-3 h-3 bg-red-500 rounded-full pointer-events-none z-[100] -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-none"
            style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
          />
          <div 
            className="fixed w-10 h-10 border border-blue-500/50 rounded-full pointer-events-none z-[99] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out flex items-center justify-center bg-blue-500/5 backdrop-blur-[1px]"
            style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
          />
        </>
      )}

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* --- Premium Animated Navbar --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        scrolled 
          ? 'bg-slate-950/80 backdrop-blur-xl border-white/10 shadow-2xl shadow-black/50 py-3' 
          : 'bg-transparent border-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="bg-white rounded-xl p-1 shadow-lg shadow-blue-500/10 border border-white/10 group-hover:scale-105 group-hover:shadow-blue-500/20 transition-all duration-300">
                <img src="/logo.png" alt="D & N AUTOMART Logo" className="h-10 w-auto object-contain" />
              </div>
              <span className="font-black text-lg sm:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 group-hover:from-blue-400 group-hover:to-white transition-all duration-500">
                D&N AUTOMART
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="relative text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors duration-300 py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full">Home</a>
              <a href="#services" className="relative text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors duration-300 py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full">Services</a>
              <a href="#trust" className="relative text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors duration-300 py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full">Why Us</a>
              <a href="#contact" className="relative text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors duration-300 py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full">Contact</a>
              
              <Link to="/login" className="relative overflow-hidden px-6 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-all duration-300 transform hover:-translate-y-0.5 border border-red-500/20 flex items-center gap-2 group shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_25px_rgba(220,38,38,0.4)]">
                <span className="relative z-10">Dealer Login</span>
                <ArrowRight className="w-3.5 h-3.5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 pointer-events-none" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section id="home" className="relative pt-32 pb-44 md:pt-48 md:pb-60 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" /> High-End Automotive Brokerage
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] text-white">
              D&N Automart <br />
              <span className="text-gradient-brand inline-block min-h-[75px]">
                {typedText}
                <span className="w-1.5 h-10 bg-blue-500 inline-block ml-1 animate-pulse" />
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              We specialize in importing high-end luxury vehicles from Japan and European auctions. Benefit from transparent logistics tracking, clearing agent automation, and authentic inspections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="#services" className="px-8 py-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 transition-all duration-300 flex items-center justify-center gap-2 border border-red-500/20 transform hover:-translate-y-0.5 animate-bounce-cta">
                View Services <ArrowRight className="w-5 h-5" />
              </a>
              <a href="#contact" className="px-8 py-4 rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 hover:text-white transition-all duration-300 border border-white/10 backdrop-blur-sm flex items-center justify-center">
                Get a CIF Quote
              </a>
            </div>
          </div>
          
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center z-10 w-full overflow-visible py-8">
            <div className="absolute w-[80%] h-[80%] bg-gradient-to-tr from-blue-600/15 to-red-600/10 rounded-full blur-[80px] pointer-events-none" />
            
            {/* Cylinder Stage */}
            <div className="perspective-1500 w-full h-[260px] sm:h-[320px] flex items-center justify-center relative overflow-visible pointer-events-none">
              <div 
                className="preserve-3d w-full h-full relative transition-transform duration-700 ease-out flex items-center justify-center pointer-events-none"
                style={{ transform: `rotateY(${carouselIdx * -120}deg)` }}
              >
                {/* Slide 1: Custom Porsche */}
                <div className={`absolute w-full max-w-[420px] px-4 cylinder-item-0 preserve-3d transition-all duration-500 ${carouselIdx === 0 ? 'scale-110 opacity-100 filter brightness-110 drop-shadow-[0_15px_15px_rgba(37,99,235,0.4)]' : 'scale-75 opacity-25 filter blur-[2px] grayscale'}`}>
                  <img src="/hero-car.png" alt="Porsche GT3" className="w-full h-auto object-contain animate-float" />
                </div>
                
                {/* Slide 2: Unsplash Ferrari */}
                <div className={`absolute w-full max-w-[420px] px-4 cylinder-item-1 preserve-3d transition-all duration-500 ${carouselIdx === 1 ? 'scale-110 opacity-100 filter brightness-110 drop-shadow-[0_15px_15px_rgba(220,38,38,0.4)]' : 'scale-75 opacity-25 filter blur-[2px] grayscale'}`}>
                  <img src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800" alt="Ferrari Supercar" className="w-full h-auto object-contain rounded-2xl border border-white/10 shadow-2xl" />
                </div>
                
                {/* Slide 3: Unsplash Audi */}
                <div className={`absolute w-full max-w-[420px] px-4 cylinder-item-2 preserve-3d transition-all duration-500 ${carouselIdx === 2 ? 'scale-110 opacity-100 filter brightness-110 drop-shadow-[0_15px_15px_rgba(99,102,241,0.4)]' : 'scale-75 opacity-25 filter blur-[2px] grayscale'}`}>
                  <img src="https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800" alt="Audi e-tron GT" className="w-full h-auto object-contain rounded-2xl border border-white/10 shadow-2xl" />
                </div>
              </div>
            </div>

            {/* Slider Indicators and Side Controls */}
            <div className="flex items-center gap-6 mt-6 relative z-30 pointer-events-auto">
              <button 
                onClick={() => setCarouselIdx(prev => (prev - 1 + 3) % 3)}
                className="w-10 h-10 rounded-full border border-white/10 bg-slate-900/60 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center text-white"
              >
                ‹
              </button>
              <div className="flex gap-2">
                {[0, 1, 2].map(idx => (
                  <button 
                    key={idx}
                    onClick={() => setCarouselIdx(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${carouselIdx === idx ? 'w-6 bg-red-500' : 'w-2 bg-white/25'}`}
                  />
                ))}
              </div>
              <button 
                onClick={() => setCarouselIdx(prev => (prev + 1) % 3)}
                className="w-10 h-10 rounded-full border border-white/10 bg-slate-900/60 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center text-white"
              >
                ›
              </button>
            </div>
          </div>
        </div>


      </section>

      {/* --- About Us Premium Section --- */}
      <div className="bg-slate-50 w-full relative z-10 border-t border-slate-200">
        <section 
          id="about" 
          ref={el => sectionRefs.current[4] = el}
          className="pt-24 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative opacity-0 translate-y-10 transition-all duration-700"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              {/* Glowing Backdrop */}
              <div className="absolute inset-0 bg-blue-500/10 rounded-3xl blur-2xl transform -rotate-3" />
              <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-2xl group bg-white">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10 pointer-events-none" />
                <img 
                  src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200" 
                  alt="Luxury Car Dealership Interior" 
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute bottom-6 left-6 z-20 flex items-center gap-4">
                  <div className="bg-white/90 px-6 py-4 rounded-2xl border border-white/50 backdrop-blur-md shadow-xl">
                    <span className="block text-3xl font-black text-slate-900">10+</span>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">Years of Trust</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div>
                <h2 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <div className="w-8 h-px bg-red-600" /> About Us
                </h2>
                <h3 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.1]">
                  Elevating the <br /> <span className="text-blue-600">Automotive Experience</span>
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                D&N Automart (PVT) LTD is a premier luxury vehicle brokerage specializing in importing pristine vehicles directly from Japanese and European auctions. We bring the luxury showroom experience to you with complete transparency.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Our commitment goes beyond sales. We provide end-to-end logistics, handling everything from auction bidding to harbor clearance, ensuring your dream vehicle arrives in perfect condition without hidden broker markups.
              </p>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                    <Star className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">Premium Quality</h5>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Verified Imports</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:ml-8">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
                    <ShieldCheck className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">Trusted Network</h5>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">100% Guaranteed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* --- Live Inventory Section --- */}


      {/* --- Services Section --- */}
      <section 
        id="services" 
        ref={el => sectionRefs.current[1] = el}
        className="py-24 border-y border-white/5 bg-slate-950 relative opacity-0 translate-y-10 transition-all duration-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest">Core Capabilities</h2>
            <h3 className="text-4xl font-black text-white">Import Solutions We Provide</h3>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-red-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Auction Bidding */}
            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-2xl hover:border-blue-500/35 transition duration-300 relative group overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transform transition">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Live Auction Bidding</h4>
              <p className="text-xs text-slate-400 leading-relaxed">We provide direct access to Japanese USS, TAA, and CAA auction pipelines, enabling bidding at broker costs.</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Custom Clearing */}
            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-2xl hover:border-blue-500/35 transition duration-300 relative group overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-6 group-hover:scale-110 transform transition">
                <Ship className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Harbor & Custom Clearance</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Integrated custom agents automatically file tax duties and demurrage assessments to clear cargo efficiently.</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Document Vault */}
            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-2xl hover:border-blue-500/35 transition duration-300 relative group overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transform transition">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Secure Document Vault</h4>
              <p className="text-xs text-slate-400 leading-relaxed">We host an encrypted portal securing your Bill of Lading, custom declarations, and auction sheets safely.</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>
      </section>

      {/* --- Why Choose Us Section --- */}
      <div className="bg-slate-50 w-full relative z-10 border-y border-slate-200">
        <section 
          id="trust" 
          ref={el => sectionRefs.current[2] = el}
          className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative opacity-0 translate-y-10 transition-all duration-700"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Why Choose Us</h2>
                <h3 className="text-4xl sm:text-5xl font-black text-slate-900">Unrivaled Import Transparency</h3>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-red-600 mt-4 rounded-full" />
              </div>
              <p className="text-slate-600 leading-relaxed text-sm">
                D&N Automart (PVT) LTD is a premier registered vehicle brokerage. By combining state-of-the-art tech platforms with direct clearing relations, we eliminate brokers' markup, ensuring you pay the actual auction value + tax duty.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4 p-4 rounded-xl hover:bg-white transition border border-transparent hover:border-slate-200 hover:shadow-lg">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Authentic Auction Sheets</h4>
                    <p className="text-xs text-slate-500 mt-1">We verify grading reports, ensuring mileage and mechanical components match auction files exactly.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-xl hover:bg-white transition border border-transparent hover:border-slate-200 hover:shadow-lg">
                  <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Full Duty Guarantee</h4>
                    <p className="text-xs text-slate-500 mt-1">We calculate custom tax values prior to bidding, ensuring there are zero surprise clearance costs.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-2xl relative max-w-[420px] w-full text-center space-y-6">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent rounded-3xl pointer-events-none" />
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10 mx-auto p-2 border border-slate-100 relative z-10">
                  <img src="/logo.png" alt="D & N Brand Logo" className="w-full h-full object-contain" />
                </div>
                <div className="relative z-10">
                  <h4 className="text-xl font-bold text-slate-900">D & N AUTOMART</h4>
                  <p className="text-xs text-slate-500 mt-1">Registered Importer (PVT) LTD</p>
                </div>
                <div className="flex justify-center gap-1 text-amber-400 relative z-10">
                  {[1,2,3,4,5].map(x => <Star key={x} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-xs text-slate-600 italic relative z-10">"Highly professional service. Cleared my vehicle on time and handled all tax documents perfectly."</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* --- Interactive Google Map & Contact Section --- */}
      <section 
        id="contact" 
        ref={el => sectionRefs.current[3] = el}
        className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 opacity-0 translate-y-10 transition-all duration-700"
      >
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md relative">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-5 p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5">
              <div className="space-y-6">
                <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Locate Us</h2>
                <h3 className="text-4xl font-extrabold text-white">Get in Touch</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  We are situated in Avissawella. Visit our corporate office or contact our logistics coordinators below.
                </p>
              </div>
              
              <div className="space-y-6 mt-8">
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                    <Phone className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="font-semibold text-sm">+94 77 344 6380</span>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="font-semibold text-sm">dandn.automart@gmail.com</span>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="font-semibold text-sm">A162/19, Nilminiuyana, Madola, Avissawella</span>
                </div>
              </div>

              {/* Responsive Google Maps Iframe */}
              <div className="mt-8 rounded-xl overflow-hidden border border-white/10 h-48 shadow-lg shadow-black/50">
                <iframe
                  title="D&N Automart Office Location"
                  src="https://maps.google.com/maps?q=A162/19,%20Nilminiuyana,%20Madola,%20Avissawella&t=&z=13&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
            
            <div className="lg:col-span-7 p-12 lg:p-16">
              <h3 className="text-2xl font-bold text-white mb-6">Schedule a Test Drive / Inquire</h3>
              <form onSubmit={handleInquirySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      required 
                      value={inquiry.name} 
                      onChange={e => setInquiry({...inquiry, name: e.target.value})} 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition duration-200" 
                      placeholder="e.g. Ruwan Silva" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                    <input 
                      value={inquiry.phone} 
                      onChange={e => setInquiry({...inquiry, phone: e.target.value})} 
                      type="tel" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition duration-200" 
                      placeholder="e.g. 077 123 4567" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input 
                    required 
                    value={inquiry.email} 
                    onChange={e => setInquiry({...inquiry, email: e.target.value})} 
                    type="email" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition duration-200" 
                    placeholder="ruwan@example.com" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Required Model / Inquiry Details</label>
                  <textarea 
                    required 
                    value={inquiry.message} 
                    onChange={e => setInquiry({...inquiry, message: e.target.value})} 
                    rows={4} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition duration-200 resize-none" 
                    placeholder="Provide details about the vehicle, auction sheet query, or custom shipping..." 
                  />
                </div>
                
                <button 
                  disabled={submitting} 
                  type="submit" 
                  className="w-full py-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 border border-red-500/20 transition duration-300 disabled:opacity-50 text-xs font-bold uppercase tracking-wider"
                >
                  {submitting ? 'Submitting Inquiry...' : 'Submit Inquiry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* --- Premium Luxury Footer --- */}
      <footer className="bg-[#0a0f1c] text-slate-400 py-16 border-t border-white/5 relative z-10 overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8 mb-16">
            
            {/* Column 1: Brand */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-xl p-1 shadow-lg shadow-blue-500/10 border border-white/10 w-12 h-12 flex items-center justify-center">
                  <img src="/logo.png" alt="D & N AUTOMART Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-xl tracking-tight text-white">D&N AUTOMART</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-500">
                The pinnacle of luxury vehicle importing. We deliver uncompromised quality directly from elite global auctions to your driveway.
              </p>
              <div className="flex gap-4">
                {/* Minimal Social Icons */}
                <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all duration-300 group">
                  <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all duration-300 group">
                  <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Experience</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#services" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">Brokerage Services</a></li>
                <li><a href="#trust" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">Why Choose Us</a></li>
                <li><a href="#about" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">Our Legacy</a></li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Inquiries</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
                  <span>A162/19, Nilminiuyana,<br />Madola, Avissawella</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                  <span>+94 77 344 6380</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                  <span>dandn.automart@gmail.com</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Sub-footer */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-medium text-slate-500">
              © {new Date().getFullYear()} D & N AUTOMART (PVT) LTD. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
              <a href="#" className="hover:text-white transition duration-200">Privacy</a>
              <a href="#" className="hover:text-white transition duration-200">Terms</a>
              <div className="w-px h-4 bg-white/20" />
              <Link to="/login" className="text-red-500 hover:text-red-400 transition duration-200 flex items-center gap-2">
                Dealer Portal <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
