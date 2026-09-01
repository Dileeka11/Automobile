import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { Car, ShieldCheck, Star, Phone, Mail, MapPin, ArrowRight, Gauge, CheckCircle, Ship, Award, Users, Search, RefreshCw, Layers, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useDataStore, toast } from '@/store';

/** Built-in hero images, used until an admin uploads a replacement */
const DEFAULT_HERO_SLIDES = [
  { src: '/hero-car.png', alt: 'Porsche GT3' },
  { src: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800', alt: 'Ferrari Supercar' },
  { src: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800', alt: 'Audi e-tron GT' },
];

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

  // Hero images — replaced from the admin "Website Customize" page when uploaded
  const [heroSlides, setHeroSlides] = useState(DEFAULT_HERO_SLIDES);
  useEffect(() => {
    let active = true;
    fetch('/backend/api/hero_slides.php')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { slot: number; filePath: string; altText: string | null }[]) => {
        if (!active || !Array.isArray(rows)) return;
        setHeroSlides((current) =>
          current.map((slide, idx) => {
            const custom = rows.find((r) => Number(r.slot) === idx + 1);
            return custom
              ? {
                  src: `/backend/api/image.php?path=${encodeURIComponent(custom.filePath)}`,
                  alt: custom.altText || slide.alt,
                }
              : slide;
          }),
        );
      })
      .catch(() => { /* keep the built-in images */ });
    return () => { active = false; };
  }, []);

  // "Our Clients" cards — managed from the admin Website Customize page
  const [clients, setClients] = useState<{ id: number; name: string; city: string | null; filePath: string | null }[]>([]);
  useEffect(() => {
    let active = true;
    fetch('/backend/api/clients.php')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => { if (active && Array.isArray(rows)) setClients(rows); })
      .catch(() => { /* section simply stays hidden */ });
    return () => { active = false; };
  }, []);

  // The strip shows five per row; anything beyond that is reached with the arrows
  const clientsTrack = useRef<HTMLDivElement | null>(null);
  const scrollClients = (dir: -1 | 1) => {
    const el = clientsTrack.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  /* ── Visitor feedback: approved entries + the submission form ── */
  interface Feedback { id: number; name: string; city: string | null; rating: number; message: string; createdAt: string; }
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [openFeedback, setOpenFeedback] = useState<Feedback | null>(null);
  const feedbackTrack = useRef<HTMLDivElement | null>(null);
  const scrollFeedback = (dir: -1 | 1) => {
    const el = feedbackTrack.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  const loadFeedback = () => {
    fetch('/backend/api/feedback.php')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => { if (Array.isArray(rows)) setFeedback(rows); })
      .catch(() => { /* section simply stays hidden */ });
  };
  useEffect(() => { loadFeedback(); }, []);

  const [fbForm, setFbForm] = useState({ name: '', city: '', rating: 5, message: '' });
  const [fbSending, setFbSending] = useState(false);
  const [fbDone, setFbDone] = useState(false);

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbForm.name.trim() || !fbForm.message.trim()) return;
    setFbSending(true);
    try {
      const resp = await fetch('/backend/api/feedback.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fbForm),
      });
      if (!resp.ok) throw new Error('failed');
      setFbForm({ name: '', city: '', rating: 5, message: '' });
      setFbDone(true);
    } catch {
      alert('Sorry, your feedback could not be sent. Please try again.');
    } finally {
      setFbSending(false);
    }
  };
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
      const res = await fetch('/backend/api/leads.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiry)
      });
      if (!res.ok) throw new Error('Submission failed');
      
      Swal.fire({
        title: 'Inquiry Submitted!',
        text: 'Thank you for reaching out. Our team will contact you shortly.',
        icon: 'success',
        confirmButtonColor: '#4169E1',
        background: '#ffffff',
        color: '#1f2937'
      });

      setInquiry({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      Swal.fire({
        title: 'Submission Failed',
        text: 'Failed to send inquiry. Please check your connection and try again.',
        icon: 'error',
        confirmButtonColor: '#4169E1',
        background: '#ffffff',
        color: '#1f2937'
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
      <div className="fixed inset-0 z-50 bg-silver-100 flex flex-col items-center justify-center text-slate-900 font-sans">
        {/* Preloader Silhouette/Spinning Wheel Animation */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-t-brand-600 border-r-transparent border-b-bluegray-400 border-l-transparent animate-spin" />
          <div className="absolute w-28 h-28 rounded-full border-2 border-dashed border-silver-300 animate-spin-slow" />
          <Car className="w-14 h-14 text-brand-600 drop-shadow-[0_0_15px_rgba(65,105,225,0.6)] animate-pulse" />
        </div>
        <h2 className="mt-8 text-xl font-bold tracking-widest text-slate-900 uppercase">D&N AUTOMART</h2>
        <p className="mt-2 text-xs font-bold text-bluegray-500 uppercase tracking-widest">Loading Premium Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-silver-100 text-slate-900 font-sans selection:bg-brand-500 selection:text-white overflow-x-hidden">

      {/* Background Glows with React Parallax Animation */}
      <div
        className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none transition-transform duration-700 ease-out"
        style={{ transform: `translate(${getParallaxOffset(-40).x}px, ${getParallaxOffset(-40).y}px)` }}
      />
      <div
        className="absolute top-[20%] right-1/4 w-[600px] h-[600px] bg-bluegray-400/12 rounded-full blur-[140px] pointer-events-none transition-transform duration-1000 ease-out"
        style={{ transform: `translate(${getParallaxOffset(50).x}px, ${getParallaxOffset(50).y}px)` }}
      />
      <div
        className="absolute bottom-[25%] left-10 w-[400px] h-[400px] bg-brand-400/10 rounded-full blur-[120px] pointer-events-none transition-transform duration-1000 ease-out"
        style={{ transform: `translate(${getParallaxOffset(-30).x}px, ${getParallaxOffset(-30).y}px)` }}
      />

      {/* Custom Animated Mouse Pointer */}
      {cursorVisible && (
        <>
          <div
            className="fixed w-3 h-3 bg-brand-500 rounded-full pointer-events-none z-[100] -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(65,105,225,0.8)] transition-none"
            style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
          />
          <div
            className="fixed w-10 h-10 border border-brand-400/50 rounded-full pointer-events-none z-[99] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out flex items-center justify-center bg-brand-400/5 backdrop-blur-[1px]"
            style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
          />
        </>
      )}

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e3e9f0_1px,transparent_1px),linear-gradient(to_bottom,#e3e9f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* --- Premium Animated Navbar --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-silver-200 shadow-lg shadow-slate-300/40 py-3'
          : 'bg-transparent border-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="bg-white rounded-xl p-1 shadow-md ring-1 ring-silver-200 group-hover:scale-105 group-hover:ring-brand-300 transition-all duration-300">
                <img src="/logo.png" alt="D & N AUTOMART Logo" className="h-10 w-auto object-contain" />
              </div>
              <span className="font-black text-lg sm:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 group-hover:from-brand-600 group-hover:to-brand-400 transition-all duration-500">
                D&N AUTOMART
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="relative text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-700 transition-colors duration-300 py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-brand-500 after:transition-all after:duration-300 hover:after:w-full">Home</a>
              <a href="#services" className="relative text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-700 transition-colors duration-300 py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-brand-500 after:transition-all after:duration-300 hover:after:w-full">Services</a>
              <a href="#trust" className="relative text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-700 transition-colors duration-300 py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-brand-500 after:transition-all after:duration-300 hover:after:w-full">Why Us</a>
              <a href="#contact" className="relative text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-700 transition-colors duration-300 py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-brand-500 after:transition-all after:duration-300 hover:after:w-full">Contact</a>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section id="home" className="relative pt-32 pb-44 md:pt-48 md:pb-60 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" /> High-End Automotive Brokerage
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] text-slate-900">
              D&N Automart <br />
              <span className="text-gradient-brand inline-block min-h-[75px]">
                {typedText}
                <span className="w-1.5 h-10 bg-brand-500 inline-block ml-1 animate-pulse" />
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              We specialize in importing high-end luxury vehicles from Japan and European auctions. Benefit from transparent logistics tracking, clearing agent automation, and authentic inspections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="#services" className="px-8 py-4 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/30 transition-all duration-300 flex items-center justify-center gap-2 border border-brand-500/20 transform hover:-translate-y-0.5 animate-bounce-cta">
                View Services <ArrowRight className="w-5 h-5" />
              </a>
              <a href="#contact" className="px-8 py-4 rounded-xl bg-white text-slate-700 font-bold hover:bg-silver-100 hover:text-brand-700 transition-all duration-300 border border-silver-200 hover:border-brand-300 shadow-sm flex items-center justify-center">
                Get a CIF Quote
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex flex-col items-center justify-center z-10 w-full overflow-visible py-8">
            <div className="absolute w-[80%] h-[80%] bg-gradient-to-tr from-brand-500/15 to-bluegray-400/15 rounded-full blur-[80px] pointer-events-none" />

            {/* Cylinder Stage */}
            <div className="perspective-1500 w-full h-[260px] sm:h-[320px] flex items-center justify-center relative overflow-visible pointer-events-none">
              <div
                className="preserve-3d w-full h-full relative transition-transform duration-700 ease-out flex items-center justify-center pointer-events-none"
                style={{ transform: `rotateY(${carouselIdx * -120}deg)` }}
              >
                {heroSlides.map((slide, idx) => (
                  <div
                    key={idx}
                    className={`absolute w-full max-w-[420px] px-4 cylinder-item-${idx} preserve-3d transition-all duration-500 ${carouselIdx === idx ? 'scale-110 opacity-100 filter brightness-105 drop-shadow-[0_15px_15px_rgba(65,105,225,0.35)]' : 'scale-75 opacity-25 filter blur-[2px] grayscale'}`}
                  >
                    <img src={slide.src} alt={slide.alt} className="w-full aspect-[3/2] object-cover rounded-2xl border border-silver-200 shadow-2xl" />
                  </div>
                ))}
              </div>
            </div>

            {/* Slider Indicators and Side Controls */}
            <div className="flex items-center gap-6 mt-6 relative z-30 pointer-events-auto">
              <button
                onClick={() => setCarouselIdx(prev => (prev - 1 + 3) % 3)}
                className="w-10 h-10 rounded-full border border-silver-200 bg-white hover:bg-silver-100 hover:border-brand-300 transition-all flex items-center justify-center text-slate-700 shadow-sm"
              >
                ‹
              </button>
              <div className="flex gap-2">
                {[0, 1, 2].map(idx => (
                  <button
                    key={idx}
                    onClick={() => setCarouselIdx(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${carouselIdx === idx ? 'w-6 bg-brand-500' : 'w-2 bg-bluegray-300'}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCarouselIdx(prev => (prev + 1) % 3)}
                className="w-10 h-10 rounded-full border border-silver-200 bg-white hover:bg-silver-100 hover:border-brand-300 transition-all flex items-center justify-center text-slate-700 shadow-sm"
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
              <div className="absolute inset-0 bg-brand-500/10 rounded-3xl blur-2xl transform -rotate-3" />
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
                <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <div className="w-8 h-px bg-brand-600" /> About Us
                </h2>
                <h3 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.1]">
                  Elevating the <br /> <span className="text-brand-600">Automotive Experience</span>
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
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center border border-brand-200">
                    <Star className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">Premium Quality</h5>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Verified Imports</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:ml-8">
                  <div className="w-10 h-10 rounded-full bg-bluegray-100 flex items-center justify-center border border-bluegray-200">
                    <ShieldCheck className="w-4 h-4 text-bluegray-600" />
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
        className="py-24 border-y border-silver-200 bg-white relative opacity-0 translate-y-10 transition-all duration-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest">Core Capabilities</h2>
            <h3 className="text-4xl font-black text-slate-900">Import Solutions We Provide</h3>
            <div className="w-16 h-1 bg-gradient-to-r from-brand-600 to-bluegray-400 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Auction Bidding */}
            <div className="bg-silver-50 border border-silver-200 p-8 rounded-2xl hover:border-brand-300 hover:shadow-lg transition duration-300 relative group overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transform transition">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Live Auction Bidding</h4>
              <p className="text-xs text-slate-500 leading-relaxed">We provide direct access to Japanese USS, TAA, and CAA auction pipelines, enabling bidding at broker costs.</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Custom Clearing */}
            <div className="bg-silver-50 border border-silver-200 p-8 rounded-2xl hover:border-brand-300 hover:shadow-lg transition duration-300 relative group overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-bluegray-100 border border-bluegray-200 flex items-center justify-center text-bluegray-600 mb-6 group-hover:scale-110 transform transition">
                <Ship className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Harbor & Custom Clearance</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Integrated custom agents automatically file tax duties and demurrage assessments to clear cargo efficiently.</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-bluegray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Document Vault */}
            <div className="bg-silver-50 border border-silver-200 p-8 rounded-2xl hover:border-brand-300 hover:shadow-lg transition duration-300 relative group overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 mb-6 group-hover:scale-110 transform transition">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Secure Document Vault</h4>
              <p className="text-xs text-slate-500 leading-relaxed">We host an encrypted portal securing your Bill of Lading, custom declarations, and auction sheets safely.</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>
      </section>

      {/* --- Our Clients Section --- */}
      {clients.length > 0 && (
        <section id="clients" className="py-24 bg-silver-50 border-b border-silver-200 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 space-y-4">
              <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest">Our Clients</h2>
              <h3 className="text-4xl font-black text-slate-900">Driven Home By Happy Owners</h3>
              <div className="w-16 h-1 bg-gradient-to-r from-brand-600 to-bluegray-400 mx-auto rounded-full" />
            </div>

            <div className="relative">
              {clients.length > 5 && (
                <button
                  type="button"
                  onClick={() => scrollClients(-1)}
                  aria-label="Previous clients"
                  className="absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-silver-200 shadow-md text-slate-600 hover:text-brand-700 hover:border-brand-300 transition flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <div
                ref={clientsTrack}
                className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-1 px-1 no-scrollbar"
              >
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className="snap-start flex-shrink-0 w-[calc(50%-10px)] sm:w-[calc(33.333%-14px)] lg:w-[calc(20%-16px)] bg-white border border-silver-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-brand-300 hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="bg-silver-100 overflow-hidden">
                      {c.filePath ? (
                        <img
                          src={`/backend/api/image.php?path=${encodeURIComponent(c.filePath)}`}
                          alt={c.name}
                          loading="lazy"
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full aspect-square" />
                      )}
                    </div>
                    <div className="p-4 text-center">
                      <p className="font-bold text-sm text-slate-900 truncate" title={c.name}>{c.name}</p>
                      {c.city && (
                        <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {c.city}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {clients.length > 5 && (
                <button
                  type="button"
                  onClick={() => scrollClients(1)}
                  aria-label="More clients"
                  className="absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-silver-200 shadow-md text-slate-600 hover:text-brand-700 hover:border-brand-300 transition flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>
      )}

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
                <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">Why Choose Us</h2>
                <h3 className="text-4xl sm:text-5xl font-black text-slate-900">Unrivaled Import Transparency</h3>
                <div className="w-16 h-1 bg-gradient-to-r from-brand-600 to-bluegray-400 mt-4 rounded-full" />
              </div>
              <p className="text-slate-600 leading-relaxed text-sm">
                D&N Automart (PVT) LTD is a premier registered vehicle brokerage. By combining state-of-the-art tech platforms with direct clearing relations, we eliminate brokers' markup, ensuring you pay the actual auction value + tax duty.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4 p-4 rounded-xl hover:bg-white transition border border-transparent hover:border-slate-200 hover:shadow-lg">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 border border-brand-200 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Authentic Auction Sheets</h4>
                    <p className="text-xs text-slate-500 mt-1">We verify grading reports, ensuring mileage and mechanical components match auction files exactly.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl hover:bg-white transition border border-transparent hover:border-slate-200 hover:shadow-lg">
                  <div className="w-12 h-12 rounded-xl bg-bluegray-100 border border-bluegray-200 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-bluegray-600" />
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
                <div className="absolute inset-0 bg-gradient-to-b from-brand-50/60 to-transparent rounded-3xl pointer-events-none" />
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/10 mx-auto p-2 border border-slate-100 relative z-10">
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

      {/* --- Client Feedback Section --- */}
      <section id="feedback" className="py-24 bg-white border-b border-silver-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

          {/* Approved feedback cards - three per row, arrows for the rest */}
          {feedback.length > 0 && (
            <div>
              <div className="text-center mb-14 space-y-4">
                <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest">Client Feedback</h2>
                <h3 className="text-4xl font-black text-slate-900">What Our Customers Say</h3>
                <div className="w-16 h-1 bg-gradient-to-r from-brand-600 to-bluegray-400 mx-auto rounded-full" />
              </div>

              <div className="relative">
                {feedback.length > 3 && (
                  <button
                    type="button"
                    onClick={() => scrollFeedback(-1)}
                    aria-label="Previous feedback"
                    className="absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-silver-200 shadow-md text-slate-600 hover:text-brand-700 hover:border-brand-300 transition flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}

                <div
                  ref={feedbackTrack}
                  className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-1 px-1 no-scrollbar"
                >
                  {feedback.map((f) => {
                    const isLong = f.message.length > 180;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setOpenFeedback(f)}
                        className="snap-start flex-shrink-0 w-[calc(100%-8px)] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] text-left bg-silver-50 border border-silver-200 rounded-2xl p-6 hover:shadow-lg hover:border-brand-300 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                      >
                        <div className="flex gap-0.5 text-amber-400 mb-4">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`w-4 h-4 ${n <= f.rating ? 'fill-current' : 'text-slate-200 fill-slate-200'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-slate-600 italic leading-relaxed line-clamp-4 flex-1">&ldquo;{f.message}&rdquo;</p>
                        {isLong && (
                          <span className="text-xs font-bold text-brand-600 mt-2">... See more</span>
                        )}
                        <div className="mt-5 pt-4 border-t border-silver-200">
                          <p className="font-bold text-sm text-slate-900">{f.name}</p>
                          {f.city && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {f.city}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {feedback.length > 3 && (
                  <button
                    type="button"
                    onClick={() => scrollFeedback(1)}
                    aria-label="More feedback"
                    className="absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-silver-200 shadow-md text-slate-600 hover:text-brand-700 hover:border-brand-300 transition flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Leave feedback */}
          <div className="max-w-3xl mx-auto bg-silver-50 border border-silver-200 rounded-3xl p-8 sm:p-10">
            <div className="text-center mb-8 space-y-2">
              <h3 className="text-2xl font-black text-slate-900">Share Your Experience</h3>
              <p className="text-sm text-slate-500">
                Imported a vehicle with us? Tell us how it went - we publish reviews after a quick check.
              </p>
            </div>

            {fbDone ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-900">Thank you for your feedback!</p>
                <p className="text-sm text-slate-500">It will appear here once our team approves it.</p>
                <button type="button" onClick={() => setFbDone(false)} className="text-xs font-bold text-brand-600 hover:underline">
                  Write another
                </button>
              </div>
            ) : (
              <form onSubmit={submitFeedback} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Name</label>
                    <input
                      required
                      maxLength={150}
                      value={fbForm.name}
                      onChange={(e) => setFbForm({ ...fbForm, name: e.target.value })}
                      placeholder="e.g. Ruwan Silva"
                      className="mt-2 w-full bg-white border border-silver-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-brand-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">City</label>
                    <input
                      maxLength={120}
                      value={fbForm.city}
                      onChange={(e) => setFbForm({ ...fbForm, city: e.target.value })}
                      placeholder="e.g. Kandy"
                      className="mt-2 w-full bg-white border border-silver-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Rating</label>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setFbForm({ ...fbForm, rating: n })}
                        aria-label={`Rate ${n} out of 5`}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-6 h-6 ${n <= fbForm.rating ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Feedback</label>
                  <textarea
                    required
                    rows={4}
                    maxLength={2000}
                    value={fbForm.message}
                    onChange={(e) => setFbForm({ ...fbForm, message: e.target.value })}
                    placeholder="Tell us about your import experience..."
                    className="mt-2 w-full bg-white border border-silver-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-brand-500 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={fbSending}
                  className="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold transition-all duration-300 shadow-lg shadow-brand-600/20"
                >
                  {fbSending ? 'Sending...' : 'Submit Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Full feedback popup */}
      {openFeedback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpenFeedback(null)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b border-silver-200">
              <div>
                <p className="font-black text-lg text-slate-900">{openFeedback.name}</p>
                {openFeedback.city && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {openFeedback.city}
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpenFeedback(null)}
                aria-label="Close"
                className="p-1.5 rounded-lg hover:bg-silver-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`w-5 h-5 ${n <= openFeedback.rating ? 'fill-current' : 'text-slate-200 fill-slate-200'}`} />
                ))}
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">&ldquo;{openFeedback.message}&rdquo;</p>
            </div>
          </div>
        </div>
      )}

      {/* --- Interactive Google Map & Contact Section --- */}
      <section 
        id="contact" 
        ref={el => sectionRefs.current[3] = el}
        className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 opacity-0 translate-y-10 transition-all duration-700"
      >
        <div className="bg-white border border-silver-200 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-5 p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-silver-200">
              <div className="space-y-6">
                <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest">Locate Us</h2>
                <h3 className="text-4xl font-extrabold text-slate-900">Get in Touch</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We are situated in Avissawella. Visit our corporate office or contact our logistics coordinators below.
                </p>
              </div>

              <div className="space-y-6 mt-8">
                <div className="flex items-center gap-4 text-slate-700">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center border border-brand-100">
                    <Phone className="w-5 h-5 text-brand-600" />
                  </div>
                  <span className="font-semibold text-sm">+94 77 344 6380</span>
                </div>
                <div className="flex items-center gap-4 text-slate-700">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center border border-brand-100">
                    <Mail className="w-5 h-5 text-brand-600" />
                  </div>
                  <span className="font-semibold text-sm">dandn.automart@gmail.com</span>
                </div>
                <div className="flex items-center gap-4 text-slate-700">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center border border-brand-100">
                    <MapPin className="w-5 h-5 text-brand-600" />
                  </div>
                  <span className="font-semibold text-sm">A162/19, Nilminiuyana, Madola, Avissawella</span>
                </div>
              </div>

              {/* Responsive Google Maps Iframe */}
              <div className="mt-8 rounded-xl overflow-hidden border border-silver-200 h-48 shadow-lg shadow-slate-300/40">
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
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Schedule a Test Drive / Inquire</h3>
              <form onSubmit={handleInquirySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      required
                      value={inquiry.name}
                      onChange={e => setInquiry({...inquiry, name: e.target.value})}
                      type="text"
                      className="w-full bg-silver-50 border border-silver-200 rounded-xl py-3.5 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition duration-200"
                      placeholder="e.g. Ruwan Silva"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Phone Number</label>
                    <input
                      value={inquiry.phone}
                      onChange={e => setInquiry({...inquiry, phone: e.target.value})}
                      type="tel"
                      className="w-full bg-silver-50 border border-silver-200 rounded-xl py-3.5 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition duration-200"
                      placeholder="e.g. 077 123 4567"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    required
                    value={inquiry.email}
                    onChange={e => setInquiry({...inquiry, email: e.target.value})}
                    type="email"
                    className="w-full bg-silver-50 border border-silver-200 rounded-xl py-3.5 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition duration-200"
                    placeholder="ruwan@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Required Model / Inquiry Details</label>
                  <textarea
                    required
                    value={inquiry.message}
                    onChange={e => setInquiry({...inquiry, message: e.target.value})}
                    rows={4}
                    className="w-full bg-silver-50 border border-silver-200 rounded-xl py-3.5 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition duration-200 resize-none"
                    placeholder="Provide details about the vehicle, auction sheet query, or custom shipping..."
                  />
                </div>

                <button
                  disabled={submitting}
                  type="submit"
                  className="w-full py-4 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/20 border border-brand-500/20 transition duration-300 disabled:opacity-50 text-xs uppercase tracking-wider"
                >
                  {submitting ? 'Submitting Inquiry...' : 'Submit Inquiry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* --- Premium Luxury Footer --- */}
      <footer className="bg-navy-900 text-bluegray-300 py-16 relative z-10">
        {/* ===== Layered wave divider rising into the section above (gold accent) ===== */}
        <div className="absolute bottom-full left-0 w-full overflow-hidden leading-[0] pointer-events-none translate-y-[1px]">
          <svg className="block w-full h-[55px] sm:h-[85px]" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            {/* back wave (soft blue-gray) */}
            <path d="M0,40 C300,90 500,10 720,46 C920,78 1060,30 1200,52 L1200,120 L0,120 Z" fill="#b3c2d4" opacity="0.4" />
            {/* gold accent wave */}
            <path d="M0,66 C260,28 440,98 700,64 C920,36 1060,88 1200,58 L1200,120 L0,120 Z" fill="#f2d27a" opacity="0.6" />
            {/* front navy wave (connects flush to the footer) */}
            <path d="M0,58 C220,108 420,28 640,56 C860,84 1040,34 1200,60 L1200,120 L0,120 Z" fill="#1f3470" />
          </svg>
        </div>

        {/* ===== Animated background layer (clipped to the footer body) ===== */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Drifting aurora glow blobs */}
          <div className="absolute -top-20 left-1/4 w-[480px] h-[480px] bg-brand-500/15 rounded-full blur-[120px] footer-aurora" />
          <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] bg-bluegray-500/15 rounded-full blur-[120px] footer-aurora" style={{ animationDelay: '-6s' }} />
          <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-brand-400/10 rounded-full blur-[100px] footer-aurora" style={{ animationDelay: '-12s' }} />

          {/* Twinkling particle stars */}
          {[
            { top: '18%', left: '8%', d: '0s' }, { top: '30%', left: '22%', d: '0.6s' },
            { top: '65%', left: '14%', d: '1.2s' }, { top: '24%', left: '48%', d: '1.8s' },
            { top: '72%', left: '40%', d: '0.3s' }, { top: '40%', left: '62%', d: '2.1s' },
            { top: '20%', left: '78%', d: '0.9s' }, { top: '58%', left: '70%', d: '1.5s' },
            { top: '78%', left: '88%', d: '2.4s' }, { top: '34%', left: '92%', d: '0.4s' },
          ].map((s, i) => (
            <span
              key={i}
              className="absolute w-1 h-1 rounded-full bg-brand-200 footer-star"
              style={{ top: s.top, left: s.left, animationDelay: s.d }}
            />
          ))}

          {/* A car driving across just beneath the wave */}
          <div className="absolute top-0 left-0 right-0 h-9 overflow-hidden">
            <div className="footer-trail absolute top-[14px] h-[3px] rounded-full bg-gradient-to-l from-brand-400/90 to-transparent blur-[1px]" />
            <div className="footer-car absolute top-1">
              <Car className="w-7 h-7 text-brand-300 -scale-x-100 drop-shadow-[0_0_12px_rgba(99,137,232,0.8)]" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8 mb-16">
            
            {/* Column 1: Brand */}
            <div
              ref={el => sectionRefs.current[5] = el}
              style={{ transitionDelay: '0s' }}
              className="space-y-6 opacity-0 translate-y-10 transition-all duration-700"
            >
              <div className="flex items-center gap-3 group">
                <div className="bg-white rounded-xl p-1 shadow-lg shadow-brand-500/20 border border-white/10 w-12 h-12 flex items-center justify-center footer-logo-glow">
                  <img src="/logo.png" alt="D & N AUTOMART Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-xl tracking-tight text-white group-hover:text-brand-200 transition-colors duration-300">D&N AUTOMART</span>
              </div>
              <p className="text-sm leading-relaxed text-bluegray-400">
                The pinnacle of luxury vehicle importing. We deliver uncompromised quality directly from elite global auctions to your driveway.
              </p>
              <div className="flex gap-4">
                {/* Minimal Social Icons */}
                <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-600 hover:border-brand-500 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-500/50 transition-all duration-300 group">
                  <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-600 hover:border-brand-500 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-500/50 transition-all duration-300 group">
                  <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a
                  href="https://www.facebook.com/dn.automart"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="D & N AUTOMART on Facebook"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-600 hover:border-brand-500 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-500/50 transition-all duration-300 group"
                >
                  <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.324V1.325C24 .593 23.407 0 22.675 0z"/></svg>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div
              ref={el => sectionRefs.current[6] = el}
              style={{ transitionDelay: '0.12s' }}
              className="opacity-0 translate-y-10 transition-all duration-700"
            >
              <h4 className="text-white font-bold mb-3 tracking-wide uppercase text-sm">Experience</h4>
              <div className="h-0.5 w-12 rounded-full footer-flow mb-5" />
              <ul className="space-y-4 text-sm">
                {[
                  { href: '#services', label: 'Brokerage Services' },
                  { href: '#trust', label: 'Why Choose Us' },
                  { href: '#about', label: 'Our Legacy' },
                ].map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="group inline-flex items-center gap-2 hover:text-white hover:translate-x-1 transition-all duration-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="fx-underline">{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div
              ref={el => sectionRefs.current[7] = el}
              style={{ transitionDelay: '0.24s' }}
              className="opacity-0 translate-y-10 transition-all duration-700"
            >
              <h4 className="text-white font-bold mb-3 tracking-wide uppercase text-sm">Inquiries</h4>
              <div className="h-0.5 w-12 rounded-full footer-flow mb-5" />
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3 group hover:text-white transition-colors duration-300">
                  <MapPin className="w-5 h-5 text-brand-400 shrink-0 group-hover:scale-125 group-hover:text-brand-300 transition-transform duration-300" />
                  <span>A162/19, Nilminiuyana,<br />Madola, Avissawella</span>
                </li>
                <li className="flex items-center gap-3 group hover:text-white transition-colors duration-300">
                  <Phone className="w-5 h-5 text-brand-400 shrink-0 group-hover:scale-125 group-hover:text-brand-300 transition-transform duration-300" />
                  <span>+94 77 344 6380</span>
                </li>
                <li className="flex items-center gap-3 group hover:text-white transition-colors duration-300">
                  <Mail className="w-5 h-5 text-brand-400 shrink-0 group-hover:scale-125 group-hover:text-brand-300 transition-transform duration-300" />
                  <span>dandn.automart@gmail.com</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Sub-footer */}
          <div className="relative pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Flowing gradient top border */}
            <div className="absolute top-0 left-0 right-0 h-px footer-flow opacity-60" />
            <p className="text-xs font-medium text-slate-500">
              © {new Date().getFullYear()} D & N AUTOMART (PVT) LTD. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
              <a href="#" className="fx-underline hover:text-white transition duration-200">Privacy</a>
              <a href="#" className="fx-underline hover:text-white transition duration-200">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
