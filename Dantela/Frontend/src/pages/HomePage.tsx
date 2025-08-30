// src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Truck,
  Award,
  ArrowRight,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const HomePage: React.FC = () => {
  const { t, language } = useLanguage();
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const handleLanguageChange = () => forceUpdate({});
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const services = [
    {
      icon: Building2,
      title: language === 'fr' ? 'Construction BTP' : t('home.services.construction.title'),
      description:
        language === 'fr'
          ? "Expertise turque au service du développement du Cameroun. Spécialisés en construction BTP, béton prêt à l'emploi et commerce de matériaux depuis 2015."
          : t('home.services.construction.description'),
      features:
        language === 'fr'
          ? ['Génie civil', 'Architecture', 'Ingénierie', 'Urbanisation']
          : [
              t('home.services.construction.feature1'),
              t('home.services.construction.feature2'),
              t('home.services.construction.feature3'),
              t('home.services.construction.feature4'),
            ],
    },
    {
      icon: Truck,
      title: language === 'fr' ? 'Commerce Général' : t('home.services.commerce.title'),
      description:
        language === 'fr'
          ? 'Distribution et commerce de matériaux de construction de haute qualité pour tous vos projets.'
          : t('home.services.commerce.description'),
      features:
        language === 'fr'
          ? ['Matériaux de construction', 'Équipements BTP', 'Livraison rapide', 'Stock permanent']
          : [
              t('home.services.commerce.feature1'),
              t('home.services.commerce.feature2'),
              t('home.services.commerce.feature3'),
              t('home.services.commerce.feature4'),
            ],
    },
    {
      icon: Award,
      title: language === 'fr' ? 'Production Béton' : t('home.services.concrete.title'),
      description:
        language === 'fr'
          ? "Production de béton prêt à l'emploi avec les meilleures techniques turques adaptées au marché camerounais."
          : t('home.services.concrete.description'),
      features:
        language === 'fr'
          ? ['Béton haute qualité', 'Livraison sur site', 'Contrôle qualité', 'Formulations spéciales']
          : [
              t('home.services.concrete.feature1'),
              t('home.services.concrete.feature2'),
              t('home.services.concrete.feature3'),
              t('home.services.concrete.feature4'),
            ],
    },
  ];

  const stats = [
    { number: '2015', label: language === 'fr' ? "Années d'expérience" : t('home.stats.experience') },
    { number: '100+', label: language === 'fr' ? 'Projets réalisés' : t('home.stats.projects') },
    { number: '50+', label: language === 'fr' ? 'Employés formés' : t('home.stats.employees') },
    { number: '24/7', label: language === 'fr' ? 'Service client' : t('home.stats.service') },
  ];

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative text-white py-20 bg-gradient-to-br from-[#0B1B48] via-[#102A68] to-[#0E7490]">
        <div className="absolute inset-0 bg-black/15" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Texte */}
            <div>
              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">DANTELA</h1>
              <h2 className="text-2xl lg:text-3xl text-teal-300 mb-6">Construction & Commerce</h2>
              <p className="text-lg lg:text-xl text-slate-200/90 mb-8 leading-relaxed">
                {language === 'fr'
                  ? "Expertise turque au service du développement du Cameroun. Spécialisés en construction BTP, béton prêt à l'emploi et commerce de matériaux depuis 2015."
                  : t('home.hero.description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* CTA principal */}
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl
                             bg-teal-500 hover:bg-teal-600 active:bg-teal-700
                             text-white font-semibold shadow-lg transition"
                >
                  <span>{language === 'fr' ? 'Rejoindre Dantela' : t('home.hero.join')}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                {/* CTA secondaire */}
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl
                             border border-white/70 text-white/90 hover:text-white hover:border-white
                             transition"
                >
                  {language === 'fr' ? 'Nos Services' : t('home.hero.services')}
                </Link>
              </div>
            </div>

            {/* Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/soule.jpeg"
                  alt="Chantier moderne Dantela"
                  className="block w-full h-auto"
                  decoding="async"
                />
                {/* harmonisation colorimétrique légère */}
                <div className="absolute inset-0 bg-teal-500/10 mix-blend-multiply pointer-events-none" />
              </div>

              <div className="absolute -bottom-6 -left-6 bg-white text-slate-900 p-6 rounded-xl shadow-xl">
                <p className="text-2xl font-extrabold text-teal-600">2015</p>
                <p className="text-sm font-medium">
                  {language === 'fr' ? "Années d'expérience" : t('home.stats.experience')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-extrabold text-teal-600 mb-2">{stat.number}</div>
                <div className="text-slate-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              {language === 'fr' ? 'Nos Activités & Prestations' : t('home.services.title')}
            </h2>
            <p className="text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto">
              {language === 'fr'
                ? "Dantela offre une gamme complète de services dans le domaine de la construction et du commerce, alliant expertise turque et savoir-faire local."
                : t('home.services.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <div className="bg-teal-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <service.icon className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{service.title}</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-6">
                {language === 'fr' ? 'À Propos de Dantela' : t('home.about.title')}
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                {language === 'fr'
                  ? "Dantela est une société de construction et de commerce basée au Cameroun. Créée le 30 Novembre 2015 à Yaoundé par des hommes d'affaires turcs, nous avons choisi d'investir au Cameroun pour sa stabilité et sa sécurité."
                  : t('home.about.description1')}
              </p>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                {language === 'fr'
                  ? 'Notre mission est de transférer les connaissances et expériences turques dans le domaine du génie civil au Cameroun, tout en contribuant à la formation de notre personnel camerounais aux meilleures techniques.'
                  : t('home.about.description2')}
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-teal-500" />
                  <span className="text-slate-700 font-medium">
                    {language === 'fr' ? 'Transfert de connaissances turques' : t('home.about.feature1')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-teal-500" />
                  <span className="text-slate-700 font-medium">
                    {language === 'fr' ? 'Formation du personnel camerounais' : t('home.about.feature2')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-teal-500" />
                  <span className="text-slate-700 font-medium">
                    {language === 'fr' ? "Contribution à l'urbanisation du Cameroun" : t('home.about.feature3')}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Équipe Dantela"
                  className="block w-full h-auto"
                  decoding="async"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-[#0B1B48]/10 mix-blend-multiply pointer-events-none" />
              </div>
              <div className="absolute -top-6 -right-6 bg-teal-600 text-white p-6 rounded-xl shadow-xl">
                <p className="text-lg font-bold">RC/YAO/2015/B/960</p>
                <p className="text-sm/relaxed opacity-90">Registre de commerce</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="py-20 text-white bg-gradient-to-r from-[#0E7490] to-[#14B8A6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold mb-6">
            {language === 'fr' ? "Prêt à rejoindre l'équipe Dantela ?" : t('home.cta.title')}
          </h2>
          <p className="text-lg lg:text-xl mb-8 opacity-95 max-w-2xl mx-auto">
            {language === 'fr'
              ? 'Que vous soyez magazinier ou chef de chantier, rejoignez notre système de gestion moderne pour optimiser vos opérations.'
              : t('home.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 rounded-xl bg-white text-teal-700 hover:bg-slate-100 font-semibold transition"
            >
              {language === 'fr' ? 'Créer un compte' : t('home.cta.create')}
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl border border-white/80 text-white/95 hover:text-white hover:border-white transition"
            >
              {language === 'fr' ? 'Se connecter' : t('home.cta.login')}
            </Link>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-20 bg-[#0B1B48] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-teal-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Téléphone</h3>
              <p className="text-slate-200">+237 650 82 22 47 </p>
            </div>

            <div className="text-center">
              <div className="bg-teal-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email</h3>
              <p className="text-slate-200">dantelasarl@dantela.com</p>
            </div>

            <div className="text-center">
              <div className="bg-teal-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Adresse</h3>
              <p className="text-slate-200">203 Bd de l&apos;OCAM, Mvog Mbi - Yaoundé</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
